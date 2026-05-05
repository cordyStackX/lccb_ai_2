import sys
import json
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client


def _parse_audio_request():
    received_token = None
    language = None
    audio_file = None

    if request.content_type and request.content_type.startswith("multipart/form-data"):
        audio_file = request.files.get("audio")
        received_token = request.form.get("token")
        language = request.form.get("language")
    else:
        data = request.json or {}
        received_token = data.get("token")
        language = data.get("language")

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


def generate_voice_md():
    try:
        _, language, audio_file, error = _parse_audio_request()
        if error:
            return error

        # Pass the uploaded file directly; no need to save to disk.
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=audio_file,
            language=language or None,
        )

        return jsonify({"success": True, "text": transcription.text})

    except Exception as e:
        print("🔥 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


def generate_voice_md_stream():
    try:
        _, language, audio_file, error = _parse_audio_request()
        if error:
            return error

        def event_stream():
            try:
                transcription = client.audio.transcriptions.create(
                    model="gpt-4o-mini-tts",
                    file=audio_file,
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
        print("f525 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500