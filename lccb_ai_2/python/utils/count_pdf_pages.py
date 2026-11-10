import base64
import io

from flask import jsonify, request
from PyPDF2 import PdfReader

from .context import EXPECTED_API_KEY


def count_pdf_pages():
    data = request.json or {}
    if data.get("token") != EXPECTED_API_KEY:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    encoded_pdf = data.get("pdf_base64")
    if not isinstance(encoded_pdf, str) or not encoded_pdf:
        return jsonify({"success": False, "error": "PDF data is required"}), 400

    try:
        pdf_bytes = base64.b64decode(encoded_pdf, validate=True)
        page_count = len(PdfReader(io.BytesIO(pdf_bytes)).pages)
        if page_count < 1:
            return jsonify({"success": False, "error": "PDF has no pages"}), 422
        return jsonify({"success": True, "page_count": page_count})
    except Exception:
        return jsonify({"success": False, "error": "Unable to read the PDF"}), 422
