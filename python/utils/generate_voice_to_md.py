import sys
from flask import request, jsonify
from .context import EXPECTED_API_KEY, client


def generate_voice_md():
    try:
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

        # Validate token
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        if not audio_file:
            return jsonify({
                "success": False,
                "error": "Audio file is required. Use multipart/form-data with key 'audio'.",
            }), 400

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