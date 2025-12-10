import os
import sys
import threading
import time
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from google import genai
from flask_cors import CORS
from supabase import create_client, Client
from PyPDF2 import PdfReader

# -----------------------------------------
# Load .env.local from project root
# -----------------------------------------
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env.local")
load_dotenv(ENV_PATH)

# -----------------------------------------
# Init Flask
# -----------------------------------------
app = Flask(__name__)
CORS(app)  # allow Next.js to access the Flask server

# -----------------------------------------
# Environment variables
# -----------------------------------------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
EXPECTED_API_KEY = os.getenv("API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is missing in .env.local")

if not EXPECTED_API_KEY:
    raise ValueError("API_KEY must be set for security authentication")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL not found")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY not found")

# -----------------------------------------
# Gemini Client
# -----------------------------------------
client = genai.Client(api_key=GOOGLE_API_KEY)

# -----------------------------------------
# Supabase Client
# -----------------------------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# -----------------------------------------
# Helper: Delete file after delay
# -----------------------------------------
def delete_file_after_delay(file_path, delay=300):
    """Delete a file after specified delay (default 5 minutes = 300 seconds)"""
    def delete_task():
        time.sleep(delay)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️  Deleted temporary file: {file_path}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️  Failed to delete {file_path}: {e}", file=sys.stderr)
    
    thread = threading.Thread(target=delete_task, daemon=True)
    thread.start()

# -----------------------------------------
# ROUTE: Generate Markdown
# -----------------------------------------


@app.route("/generate-md", methods=["POST"])
def generate_md():
    try:
        data = request.json or {}
        received_token = data.get("token")
        prompt = data.get("prompt", "")
        file_id = data.get("pdf_id")  # new: PDF id

        # Validate token
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        if not prompt:
            return jsonify({"success": False, "error": "Prompt cannot be empty"}), 400
        if not file_id:
            return jsonify({"success": False, "error": "file_id is required"}), 400

        # --- Get file name from Supabase ---
        row = supabase.table("pdf_file").select("file_name").eq("id", file_id).single().execute()
        if not row.data:
            return jsonify({"success": False, "error": "PDF not found"}), 404

        file_name = row.data["file_name"]
        tmp_path = f"tmp/{file_name}"

        # --- Check if file exists in tmp/ directory ---
        if not os.path.exists(tmp_path):
            return jsonify({"success": False, "error": f"File not found in tmp/. Please download it first using /download-file"}), 404

        # --- Read PDF text ---
        reader = PdfReader(tmp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        # --- Strict instruction: only answer based on PDF ---
        final_prompt = f"Read the PDF content below carefully. Base your answer primarily on this content. You may add a small amount of extra information ONLY if it directly supports or explains something from the Documents and stays on-topic. Do NOT go beyond the scope of the Documents. questions:\n\n{text}\n\n Question: {prompt}"

        # --- Call Gemini ---
        result = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=final_prompt
        )

        md = result.text or ""

        return jsonify({"success": True, "markdown": md})

    except Exception as e:
        print("🔥 Gemini Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
    

 

@app.route("/download-file", methods=["POST"])
def download_file():
    try:
        data = request.json or {}
        received_token = data.get("token")
        file_id = data.get("pdf_id")  # get file id dynamically from request

        # Security
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        if not file_id:
            return jsonify({"success": False, "error": "Missing file id"}), 400

        # ---- Get file metadata from Supabase row ----
        row = supabase.table("pdf_file").select("file, file_name").eq("id", file_id).single().execute()
        if not row.data:
            return jsonify({"success": False, "error": "File not found"}), 404

        # ---- Get the path relative to the bucket ----
        file_url = row.data["file"]           # could be full public URL
        file_name = row.data["file_name"]

        # Extract path inside bucket
        if "/pdfs/" in file_url:
            file_path = file_url.split("/pdfs/")[1]  # results in uploads/xxx.pdf
        else:
            file_path = file_url  # assume already relative path

        # ---- Download content using service role key ----
        file_bytes = supabase.storage.from_("pdfs").download(file_path)
        if not file_bytes:
            return jsonify({"success": False, "error": "Failed to download file"}), 500

        # ---- Save to tmp ----
        tmp_path = f"tmp/{file_name}"
        with open(tmp_path, "wb") as f:
            f.write(file_bytes)

        # Schedule deletion after 5 minutes
        delete_file_after_delay(tmp_path, delay=300)

        return jsonify({
            "success": True,
            "tmp_path": tmp_path,
            "file_name": file_name
        })

    except Exception as e:
        print("🔥 Download error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500



# -----------------------------------------
# Run Server
# -----------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
