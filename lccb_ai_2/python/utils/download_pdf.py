import os
import sys
import urllib.parse
from flask import request, jsonify
from .context import EXPECTED_API_KEY, supabase
from .helpers import delete_file_after_delay


def download_file():
    try:
        data = request.json or {}
        received_token = data.get("token")
        file_id = data.get("pdf_id")  # get file id dynamically from request
        file_path_input = data.get("filePath")
        file_path_input2 = data.get("filePath2")
        force_refresh = data.get("force_refresh") is True

        # Security
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        # ---- Get file metadata from Supabase row ----
        if file_id:
            row = (
                supabase.table("pdf_file")
                .select("file, file_name, email")
                .eq("id", file_id)
                .single()
                .execute()
            )
        elif file_path_input:
            row = (
                supabase.table("chatbot_pdf_file")
                .select("file, file_name, email")
                .eq("file", file_path_input)
                .single()
                .execute()
            )
        elif file_path_input2:
            row = (
                supabase.table("chatbot_pdf_file_private")
                .select("file, file_name, email")
                .eq("file", file_path_input2)
                .single()
                .execute()
            )
        else:
            return jsonify({"success": False, "error": "Missing file id or file path"}), 400
        if not row.data:
            return jsonify({"success": False, "error": "File not found"}), 404

        # ---- Get the path relative to the bucket ----
        file_url = row.data["file"]  # could be full public URL
        file_name = row.data["file_name"]
        email = row.data["email"]

        # Extract path inside bucket
        if "/chatbot_pdfs/" in file_url:
            file_path = file_url.split("/chatbot_pdfs/", 1)[1]
        elif "/pdfs/" in file_url:
            file_path = file_url.split("/pdfs/")[1]
        elif "/storage/v1/object/" in file_url:
            file_path = file_url.split("/storage/v1/object/")[-1].split("/", 1)[-1]
        else:
            file_path = file_url  # assume already relative path
        file_path = urllib.parse.unquote(file_path)

        # ---- Check if file already exists in tmp ----
        tmp_path = f"/tmp/{email}_{file_name}"
        if force_refresh and os.path.exists(tmp_path):
            os.remove(tmp_path)
        if os.path.exists(tmp_path):
            return jsonify({
                "success": True,
                "tmp_path": tmp_path,
                "file_name": file_name,
                "cached": True,
            })

        # ---- Download content using service role key ----
        bucket_name = "chatbot_pdfs" if (file_path_input or file_path_input2) else "pdfs"
        file_bytes = supabase.storage.from_(bucket_name).download(file_path)
        if not file_bytes:
            return jsonify({"success": False, "error": "Failed to download file"}), 500

        # ---- Save to tmp ----
        with open(tmp_path, "wb") as f:
            f.write(file_bytes)

        # Schedule deletion after 5 minutes
        delete_file_after_delay(tmp_path, delay=30000)

        return jsonify({
            "success": True,
            "tmp_path": tmp_path,
            "file_name": file_name,
        })

    except Exception as e:
        print("🔥 Download error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
