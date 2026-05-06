import sys
import json
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client
from .generate_md import _build_prompt_context


def _parse_audio_request():
    received_token = None
    language = "en"
    audio_file = None

    if request.content_type and request.content_type.startswith("multipart/form-data"):
        audio_file = request.files.get("audio")
        received_token = request.form.get("token")
        _ = request.form.get("language")
    else:
        data = request.json or {}
        received_token = data.get("token")
        _ = data.get("language")

    if received_token != EXPECTED_API_KEY:
        return None, None, None, (jsonify({"success": False, "error": "Unauthorized"}), 401)

    if not audio_file:
        return None, None, None, (
            jsonify({
                "success": False,
                "error": "Audio file is required. Use multipart/form-data with key 'audio'.",
            }),
            400,
        )

    return received_token, language, audio_file, None


def _to_openai_file(file_storage):
    filename = file_storage.filename or "audio.webm"
    content_type = file_storage.mimetype or "application/octet-stream"
    file_bytes = file_storage.read()
    return (filename, file_bytes, content_type)


def generate_voice_md():
    try:
        _, language, audio_file, error = _parse_audio_request()
        if error:
            return error

        # Pass the uploaded file directly; no need to save to disk.
        openai_file = _to_openai_file(audio_file)
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe-2025-03-20",
            file=openai_file,
            language=language or None,
        )

        return jsonify({"success": True, "text": transcription.text})

    except Exception as e:
        print("OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


def generate_voice_md_stream():
    try:
        _, language, audio_file, error = _parse_audio_request()
        if error:
            return error

        openai_file = _to_openai_file(audio_file)

        def event_stream():
            try:
                transcription = client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe-2025-03-20",
                    file=openai_file,
                    language=language or None,
                )

                text = transcription.text or ""
                chunk_size = 80
                for i in range(0, len(text), chunk_size):
                    chunk = text[i : i + chunk_size]
                    if chunk:
                        yield f"data: {json.dumps({'text': chunk})}\n\n"

                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

    except Exception as e:
        print("OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


def generate_voice_md_stream_pdf():
    try:
        received_token, language, audio_file, error = _parse_audio_request()
        if error:
            return error

        openai_file = _to_openai_file(audio_file)

        def event_stream():
            try:
                email = request.form.get("email")
                pdf_id = request.form.get("pdf_id")
                f_name = request.form.get("f_name")
                last_user_response = request.form.get("last_user_response") or ""
                last_ai_response = request.form.get("last_ai_response") or ""

                transcription = client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe-2025-03-20",
                    file=openai_file,
                    language=language or None,
                )

                prompt = (transcription.text or "").strip()
                if not prompt:
                    yield f"data: {json.dumps({'error': 'Empty transcription'})}\n\n"
                    return

                data = {
                    "token": received_token,
                    "prompt": prompt,
                    "email": email,
                    "pdf_id": int(pdf_id) if pdf_id else None,
                    "f_name": f_name,
                    "last_user_response": last_user_response,
                    "last_ai_response": last_ai_response,
                    "method": "voice"
                }

                context, ctx_error = _build_prompt_context(data)
                if ctx_error:
                    error_body, _ = ctx_error
                    payload = error_body.get_json() if hasattr(error_body, "get_json") else None
                    message = (payload or {}).get("error") or "Context build failed"
                    yield f"data: {json.dumps({'error': message})}\n\n"
                    return

                yield f"data: {json.dumps({'prompt': prompt})}\n\n"

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
        print("OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500