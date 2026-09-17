"""Create and reuse page-level PDF summaries stored in chatbot_pdf_file.cache."""

import os
import sys
from datetime import datetime, timezone

from flask import jsonify, request
from PyPDF2 import PdfReader

from .context import EXPECTED_API_KEY, client, supabase


def _valid_cache(cache, page_count):
    return (
        isinstance(cache, dict)
        and cache.get("version") == 1
        and cache.get("page_count") == page_count
        and isinstance(cache.get("pages"), list)
        and len(cache["pages"]) == page_count
    )


def generate_pdf_cache():
    """Summarize every readable PDF page and persist the JSONB cache."""
    try:
        data = request.json or {}
        if data.get("token") != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        email = str(data.get("email", "")).strip().lower()
        file_path = str(data.get("filePath", "")).strip()
        table = data.get("table", "chatbot_pdf_file")
        if not email or not file_path or table != "chatbot_pdf_file":
            return jsonify({"success": False, "error": "Email and PDF file path are required"}), 400

        row = supabase.table(table).select("file_name, cache").eq("file", file_path).single().execute()
        if not row.data:
            return jsonify({"success": False, "error": "PDF not found"}), 404

        tmp_path = f"/tmp/{email}_{row.data['file_name']}"
        if not os.path.exists(tmp_path):
            return jsonify({"success": False, "error": "PDF is not available. Download it first."}), 404

        reader = PdfReader(tmp_path)
        page_count = len(reader.pages)
        existing_cache = row.data.get("cache")
        if _valid_cache(existing_cache, page_count):
            return jsonify({"success": True, "cache": existing_cache, "cached": True})

        pages = []
        for page_number, page in enumerate(reader.pages, start=1):
            page_text = (page.extract_text() or "").strip()
            if not page_text:
                pages.append({"page": page_number, "summary": "No extractable text was found on this page."})
                continue

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You accurately summarize document pages. Preserve names, dates, requirements, numbers, exceptions, and lists."},
                    {"role": "user", "content": f"Summarize page {page_number} of this PDF. Include every important factual detail in concise form. Do not add information not on the page.\n\n{page_text}"},
                ],
                temperature=0.1,
                max_tokens=700,
            )
            pages.append({"page": page_number, "summary": (response.choices[0].message.content or "").strip()})

        cache = {
            "version": 1,
            "page_count": page_count,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "pages": pages,
        }
        result = supabase.table(table).update({"cache": cache}).eq("file", file_path).execute()
        if not result.data:
            return jsonify({"success": False, "error": "Failed to save PDF page cache"}), 500
        return jsonify({"success": True, "cache": cache, "cached": False})
    except Exception as error:
        print("PDF cache error:", error, file=sys.stderr)
        return jsonify({"success": False, "error": "Failed to summarize every PDF page"}), 500
