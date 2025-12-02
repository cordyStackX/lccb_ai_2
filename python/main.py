import os
import bcrypt
from flask import Flask, request, jsonify
from google import genai

app = Flask(__name__)
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Expected API key from environment
EXPECTED_API_KEY = os.getenv("API_KEY")

if not EXPECTED_API_KEY:
    raise ValueError("API_KEY environment variable not set")

@app.route("/generate-md", methods=["POST"])
def generate_md():
    data = request.json
    received_token = data.get("token")
    prompt = data.get("prompt", "")

    # Compare the received token with expected API key
    if not received_token or received_token != EXPECTED_API_KEY:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    # Safe call to Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{prompt}"
    )

    return jsonify({"success": True, "markdown": response.text})

if __name__ == "__main__":
    app.run(debug=True, port=10000)
