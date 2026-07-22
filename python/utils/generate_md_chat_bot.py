import sys
import json
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client, supabase


def _build_chatbot_context(data):
    received_token = data.get("token")
    prompt = data.get("prompt", "")
    last_user_response = str(data.get("last_user_response", "")).strip()
    last_ai_response = str(data.get("last_ai_response", "")).strip()
    email = data.get("email")
    f_name = data.get("f_name")

    if received_token != EXPECTED_API_KEY:
        return None, (jsonify({"success": False, "error": "Unauthorized"}), 401)
    if not prompt:
        return None, (jsonify({"success": False, "error": "Prompt cannot be empty"}), 404)
    if not email:
        return None, (jsonify({"success": False, "error": "Email not found"}), 404)

    rows = supabase.table("chatbot_pdf_file").select("id, file_name, summary").eq("email", email).execute()

    chatbot_name = supabase.table("chatbot_public").select("name").eq("email", email).execute()
    
    if rows.data is None:
        return None, (jsonify({"success": False, "error": "Query failed"}), 500)

    if len(rows.data) < 1:
        return None, (jsonify({"success": False, "error": "No Data was setup"}), 404)

    user = supabase.table("auth").select("year, role").eq("email", email).single().execute()
    if not user.data:
        return None, (jsonify({"success": False, "error": "User not found"}), 404)

    role = "admin"
    year = "admin2026"

    summaries = []
    for item in rows.data:
        summary_text = (item.get("summary") or "").strip()
        if summary_text:
            label = item.get("file_name") or f"PDF {item.get('id')}"
            summaries.append(f"[{label}]\n{summary_text}")

    if not summaries:
        return None, (jsonify({"success": False, "error": "PDF summaries not found"}), 404)

    with open("python/python_txt_file/prompt.md", "r", encoding="utf-8") as f:
        template = f.read()

    with open("python/python_txt_file/system.md", "r", encoding="utf-8") as f:
        system_role = f.read()

    if not template:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    if not system_role:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    chunk_size = 8
    combined_text = "\n\n".join(summaries)
    if len(summaries) > chunk_size:
        chunk_summaries = []
        for i in range(0, len(summaries), chunk_size):
            chunk_text = "\n\n".join(summaries[i : i + chunk_size])
            chunk_prompt = template.format(
                documents=chunk_text,
                question=prompt,
            )

            chunk_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_role},
                    {"role": "user", "content": chunk_prompt},
                ],
                temperature=0.4,
                max_tokens=500,
            )
            chunk_md = (chunk_response.choices[0].message.content or "").strip()
            if chunk_md:
                chunk_summaries.append(chunk_md)

        if chunk_summaries:
            combined_text = "\n\n".join(chunk_summaries)

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
        user_id="null",
        method="chat_bot",
        chat_bot_name=chatbot_name
    )

    return {"final_prompt": final_prompt, "system_role": systemRole}, None


def generate_md_chatbot():
    try:
        data = request.json or {}
        context, error = _build_chatbot_context(data)
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
        print("f525 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


def generate_md_chatbot_stream():
    try:
        data = request.json or {}
        context, error = _build_chatbot_context(data)
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
        print("f525 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
