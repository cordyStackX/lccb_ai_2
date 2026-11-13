import sys
import json
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client, supabase, PDF_ENCRYPT_PASSWORD
from .prompt_loader import load_prompt_template, load_system_prompt
import hashlib
import base64
import re
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decrypt_text(payload: str, password: str) -> str:
    data = base64.b64decode(payload)

    salt = data[0:16]
    iv = data[16:28]
    auth_tag = data[28:44]
    encrypted = data[44:]

    # Must match Node's crypto.scryptSync defaults: N=16384, r=8, p=1, dklen=32
    key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
        dklen=32,
    )

    aesgcm = AESGCM(key)
    # Python's AESGCM expects ciphertext + tag concatenated together
    decrypted = aesgcm.decrypt(iv, encrypted + auth_tag, None)

    return decrypted.decode("utf-8")

def normalize_student_id(value) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().upper()
    if re.fullmatch(r"[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{3}", normalized):
        return normalized
    compact = normalized.replace("-", "")
    if re.fullmatch(r"[A-Z0-9]{9}", compact):
        return f"{compact[:2]}-{compact[2:6]}-{compact[6:]}"
    return None

def _build_prompt_context(data):
    received_token = data.get("token")
    prompt = data.get("prompt", "")
    email = data.get("email")
    f_name = data.get("f_name")
    method = data.get("method")

    if received_token != EXPECTED_API_KEY:
        return None, (jsonify({"success": False, "error": "Unauthorized"}), 401)
    if not prompt:
        return None, (jsonify({"success": False, "error": "Prompt cannot be empty"}), 400)
    if not email:
        return None, (jsonify({"success": False, "error": "Email not found"}), 400)
    if not f_name:
        return None, (jsonify({"success": False, "error": "Name not found"}), 400)

    user = supabase.table("auth_student").select("school_id").eq("email", email).single().execute()
    if not user.data or not user.data.get("school_id"):
        return None, (jsonify({"success": False, "error": "User not found"}), 404)

    # auth_student.school_id is stored as plaintext; only private PDF records
    # remain encrypted at rest.
    user_id = normalize_student_id(user.data["school_id"])
    if not user_id:
        return None, (jsonify({"success": False, "error": "Could not verify your registered student ID"}), 403)

    record_rows = []
    offset = 0
    while True:
        rows = supabase.table("chatbot_student_records").select("records_ciphertext, source_file_name, page_numbers").eq("student_email", email).range(offset, offset + 999).execute()
        if not rows.data:
            break
        record_rows.extend(rows.data)
        if len(rows.data) < 1000:
            break
        offset += 1000
    if not record_rows:
        return None, (jsonify({"success": False, "error": "No released student records found"}), 404)

    record_context = []
    for item in record_rows:
        encrypted_records = (item.get("records_ciphertext") or "").strip()
        if not encrypted_records:
            continue
        try:
            records = json.loads(decrypt_text(encrypted_records, PDF_ENCRYPT_PASSWORD or ""))
        except Exception as e:
            print(f"Failed to decrypt a student's private records: {e}", file=sys.stderr)
            continue
        if isinstance(records, list):
            for record in records:
                if not isinstance(record, dict):
                    continue
                # Enforce row ownership before any record reaches OpenAI.
                if normalize_student_id(record.get("student_id")) != user_id:
                    continue
                record_context.append(json.dumps({
                    "source": item.get("source_file_name"),
                    "record": record,
                }, ensure_ascii=False))

    if not record_context:
        return None, (jsonify({"success": False, "error": "No released records match your registered student ID"}), 404)

    template = load_prompt_template()
    system_role = load_system_prompt()

    if not template:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    if not system_role:
        return None, (jsonify({"success": False, "message": "template not found"}), 404)

    chunk_size = 8
    combined_text = "\n\n".join(record_context)
    if len(record_context) > chunk_size:
        chunk_summaries = []
        for i in range(0, len(record_context), chunk_size):
            chunk_text = "\n\n".join(record_context[i : i + chunk_size])
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
                temperature=0.7,
                max_tokens=1000,
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

    systemRole = system_role.format(
        role="student",
        name=f_name,
        method=method,
        user_id=user_id or "",
        chat_bot_name=""
    )

    return {"final_prompt": final_prompt, "system_role": systemRole}, None


def generate_md_sensitive_data():
    try:
        data = request.json or {}
        context, error = _build_prompt_context(data)
        if error:
            return error
        assert context is not None 

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
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


def generate_md_sensitive_data_stream():
    try:
        data = request.json or {}
        context, error = _build_prompt_context(data)
        if error:
            return error
        assert context is not None 

        def event_stream():
            try:
                stream = client.chat.completions.create(
                    model="gpt-4.1-mini",
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
