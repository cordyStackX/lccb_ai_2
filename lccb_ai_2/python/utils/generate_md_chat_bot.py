import sys
import json
import re
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client, supabase
from .prompt_loader import load_business_prompt, load_prompt_template


_STOP_WORDS = {"about", "after", "again", "also", "and", "are", "can", "could", "does", "for", "from", "have", "how", "into", "its", "more", "please", "that", "the", "their", "them", "there", "this", "what", "when", "where", "which", "who", "with", "would", "you", "your"}


def _tokens(text):
    return {word for word in re.findall(r"[a-z0-9]{2,}", str(text or "").lower()) if word not in _STOP_WORDS}


def _relevant_page_context(rows, question, limit=6):
    query_terms = _tokens(question)
    if not query_terms:
        return ""

    matches = []
    for document in rows:
        page_content = document.get("page_content")
        pages = page_content if isinstance(page_content, list) else []
        if not pages:
            cache = document.get("cache")
            pages = cache.get("pages", []) if isinstance(cache, dict) else []
        for item in pages:
            if not isinstance(item, dict):
                continue
            text = str(item.get("text", item.get("summary", ""))).strip()
            if not text:
                continue
            terms = _tokens(text)
            overlap = query_terms & terms
            if not overlap:
                continue
            score = len(overlap)
            # Select short passages around the user's terms to keep the model context bounded.
            windows = []
            for start in range(0, len(text), 1200):
                excerpt = text[start:start + 1200]
                excerpt_terms = _tokens(excerpt)
                excerpt_score = len(query_terms & excerpt_terms)
                if excerpt_score:
                    windows.append((excerpt_score, start, excerpt))
            windows.sort(key=lambda window: window[0], reverse=True)
            selected = sorted(windows[:3], key=lambda window: window[1])
            excerpt = "\n[…]\n".join(window[2] for window in selected)[:3600]
            matches.append((len(overlap), document.get("file_name") or f"PDF {document.get('id')}", item.get("page", "?"), excerpt))

    matches.sort(key=lambda match: match[0], reverse=True)
    return "\n\n".join(
        f"[{file_name}, page {page}]\n{excerpt}"
        for _, file_name, page, excerpt in matches[:limit]
    )


def _validated_history(data):
    raw_history = data.get("history")
    history = []
    if isinstance(raw_history, list):
        for item in raw_history[-12:]:
            if not isinstance(item, dict) or item.get("role") not in {"user", "assistant"}:
                continue
            content = item.get("content")
            if not isinstance(content, str) or not content.strip():
                continue
            history.append({"role": item["role"], "content": content.strip()[-4000:]})

    # Keep older clients working until they send structured conversation turns.
    if not history:
        last_user = str(data.get("last_user_response", "")).strip()
        last_assistant = str(data.get("last_ai_response", "")).strip()
        if last_user:
            history.append({"role": "user", "content": last_user[-4000:]})
        if last_assistant:
            history.append({"role": "assistant", "content": last_assistant[-4000:]})
    return history


def _build_chatbot_context(data):
    received_token = data.get("token")
    prompt = data.get("prompt", "")
    history = _validated_history(data)
    email = data.get("email")
    f_name = data.get("f_name")

    if received_token != EXPECTED_API_KEY:
        return None, (jsonify({"success": False, "error": "Unauthorized"}), 401)
    if not prompt:
        return None, (jsonify({"success": False, "error": "Prompt cannot be empty"}), 404)
    if not email:
        return None, (jsonify({"success": False, "error": "Email not found"}), 404)

    rows = supabase.table("chatbot_pdf_file").select("id, file_name, summary, cache, page_content").eq("email", email).execute()

    chatbot_name = supabase.table("chatbot_public").select("name").eq("email", email).execute()
    
    if rows.data is None:
        return None, (jsonify({"success": False, "error": "Query failed"}), 500)

    if len(rows.data) < 1:
        return None, (jsonify({"success": False, "error": "No Data was setup"}), 404)

    user = supabase.table("auth").select("role").eq("email", email).single().execute()
    if not user.data:
        return None, (jsonify({"success": False, "error": "User not found"}), 404)

    summaries = []
    for item in rows.data:
        summary_text = (item.get("summary") or "").strip()
        if summary_text:
            label = item.get("file_name") or f"PDF {item.get('id')}"
            summaries.append(f"[{label}]\n{summary_text}")

    if not summaries:
        return None, (jsonify({"success": False, "error": "PDF summaries not found"}), 404)

    template = load_prompt_template()
    system_role = load_business_prompt()

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

    prior_user_questions = " ".join(item["content"] for item in history if item["role"] == "user")
    page_context = _relevant_page_context(rows.data, f"{prior_user_questions} {prompt}")
    if page_context:
        final_prompt += (
            "\n\nAdditional source text retrieved from the most relevant public PDF pages. "
            "Use it to provide specific details while keeping every claim grounded in the cited document and page:\n"
            f"{page_context}"
        )

    systemRole = system_role.format(
        role="Business",
        name=f_name,
        user_id="null Need Login",
        method="chat_bot",
        chat_bot_name=chatbot_name
    )

    return {"final_prompt": final_prompt, "system_role": systemRole, "history": history}, None


def generate_md_chatbot():
    try:
        data = request.json or {}
        context, error = _build_chatbot_context(data)
        if error:
            return error

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": context["system_role"]}, *context["history"], {"role": "user", "content": context["final_prompt"]}],
            temperature=0.2,
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
                    messages=[{"role": "system", "content": context["system_role"]}, *context["history"], {"role": "user", "content": context["final_prompt"]}],
                    temperature=0.2,
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
