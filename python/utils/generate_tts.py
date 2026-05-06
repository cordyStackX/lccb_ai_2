import sys
from flask import request, jsonify, Response
from .context import EXPECTED_API_KEY, client


def generate_tts():
    try:
        data = request.json or {}
        received_token = data.get("token")
        text = str(data.get("text") or "").strip()
        voice = data.get("voice") or "alloy"

        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        if not text:
            return jsonify({"success": False, "error": "Text is required"}), 400

        # Use a smaller/faster TTS model and return WAV to avoid MP3 overhead
        # Trim very long text to reduce cost and latency
        max_chars = 600
        truncated = False
        if len(text) > max_chars:
            text = text[:max_chars]
            truncated = True

        audio = client.audio.speech.create(
            model="gpt-4o-mini-tts-2025-03-20",
            voice=voice,
            input=text,
            response_format="wav",
        )

        resp = Response(audio.content, mimetype="audio/wav")
        if truncated:
            # Inform client that text was truncated via header
            resp.headers["X-TTS-Note"] = "truncated"
        return resp

    except Exception as e:
        print("OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
