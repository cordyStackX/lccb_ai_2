import os
import sys
import json
from flask import request, jsonify, Response, stream_with_context
from PyPDF2 import PdfReader
from .context import EXPECTED_API_KEY, client, supabase


def _build_prompt_context(data):
    received_token = data.get("token")
    prompt = data.get("prompt", "")
    last_user_response = str(data.get("last_user_response", "")).strip()
    last_ai_response = str(data.get("last_ai_response", "")).strip()
    email = data.get("email")
    file_id = data.get("pdf_id")
    f_name = data.get("f_name")
    method = data.get("method")

    if received_token != EXPECTED_API_KEY:
        return None, (jsonify({"success": False, "error": "Unauthorized"}), 401)
    if not prompt:
        return None, (jsonify({"success": False, "error": "Prompt cannot be empty"}), 400)
    if not file_id:
        return None, (jsonify({"success": False, "error": "file_id is required"}), 400)
    if not email:
        return None, (jsonify({"success": False, "error": "Email not found"}), 400)
    if not f_name:
        return None, (jsonify({"success": False, "error": "Name not found"}), 400)

    row = supabase.table("pdf_file").select("file_name").eq("id", file_id).single().execute()
    if not row.data:
        return None, (jsonify({"success": False, "error": "PDF not found"}), 404)

    user = supabase.table("auth").select("year, role").eq("email", email).single().execute()
    if not user.data:
        return None, (jsonify({"success": False, "error": "User not found"}), 404)

    file_name = row.data["file_name"]
    tmp_path = f"/tmp/{email}_{file_name}"
    role = user.data["role"]
    year = user.data["year"]

    if not os.path.exists(tmp_path):
        return None, (
            jsonify({
                "success": False,
                "error": "File not found in tmp/. Please download it first using /download-file",
            }),
            404,
        )

    reader = PdfReader(tmp_path)
    chunks = []
    chunk_size = 4

    for i in range(0, len(reader.pages), chunk_size):
        chunk_text = ""
        chunk_pages = reader.pages[i : i + chunk_size]
        for page in chunk_pages:
            chunk_text += page.extract_text() or ""

        if chunk_text.strip():
            chunks.append({
                "text": chunk_text,
                "pages": f"{i+1}-{min(i+chunk_size, len(reader.pages))}",
            })

    with open("python/python_txt_file/prompt.md", "r", encoding="utf-8") as f:
        template = f.read()

    with open("python/python_txt_file/system.md", "r", encoding="utf-8") as f:
        system_role = f.read()

    if not template:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    if not system_role:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    chunk_summaries = "\n\n".join([
        f"Chunk {idx+1} (Pages {chunk['pages']}):\n{chunk['text'][:500]}..."
        for idx, chunk in enumerate(chunks)
    ])

    relevance_prompt = f"""Given this question: \"{prompt}\"
Here are summaries of document chunks:
{chunk_summaries}

Which chunks (by number) are most relevant to answer this question? 
Respond with ONLY comma-separated numbers (e.g., \"1,3,4\"). If all chunks seem relevant, say \"ALL\"."""

    relevance_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a document analyst. Identify relevant document sections."},
            {"role": "user", "content": relevance_prompt},
        ],
        temperature=0.3,
        max_tokens=50,
    )

    relevant_indices_str = relevance_response.choices[0].message.content.strip()

    if relevant_indices_str.upper() == "ALL":
        relevant_chunks = chunks
    else:
        try:
            relevant_indices = [int(x.strip()) - 1 for x in relevant_indices_str.split(",")]
            relevant_chunks = [chunks[i] for i in relevant_indices if 0 <= i < len(chunks)]
        except Exception:
            relevant_chunks = chunks

    combined_text = "\n\n".join([
        f"[Pages {chunk['pages']}]\n{chunk['text']}"
        for chunk in relevant_chunks
    ])

    final_prompt = template.format(
        documents=combined_text,
        question=prompt,
    )

    if last_user_response:
        final_prompt += (
            "\n\nConversation context (latest previous user message):\n"
            f"{last_user_response}"
        )

    if last_ai_response:
        final_prompt += (
            "\n\nConversation context (latest previous AI response):\n"
            f"{last_ai_response}"
        )

    systemRole = system_role.format(
        role=role,
        year=year,
        name=f_name,
        method=method
    )

    return {"final_prompt": final_prompt, "system_role": systemRole}, None


def generate_md():
    try:
        data = request.json or {}
        context, error = _build_prompt_context(data)
        if error:
            return error

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": context["system_role"]},
                {"role": "user", "content": context["final_prompt"]},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        md = response.choices[0].message.content or ""

        return jsonify({"success": True, "markdown": md})

    except Exception as e:
        print("🔥 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


def generate_md_stream():
    try:
        data = request.json or {}
        context, error = _build_prompt_context(data)
        if error:
            return error

        def event_stream():
            try:
                stream = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": context["system_role"]},
                        {"role": "user", "content": context["final_prompt"]},
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                    stream=True,
                )

                for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield f"data: {json.dumps({'text': delta})}\n\n"

                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

    except Exception as e:
        print("🔥 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
