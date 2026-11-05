"""Generate a content-sized set of grounded questions and answers from PDF pages."""

import json
import sys
from datetime import datetime, timezone

from flask import jsonify, request

from .context import EXPECTED_API_KEY, client, supabase


PAGES_PER_REQUEST = 8


def _update_progress(email, file_path, phase, completed, total, file_name, status="processing", message=None):
    progress = {
        "status": status,
        "phase": phase,
        "current_page": completed,
        "total_pages": total,
        "file_name": file_name,
        "message": message or f"Generating questions and answers for page {completed} of {total}.",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("chatbot_pdf_file").update({"processing_progress": progress}).eq("email", email).eq("file", file_path).execute()


def _json_items(content):
    cleaned = (content or "").strip().removeprefix("```json").removesuffix("```").strip()
    result = json.loads(cleaned)
    if not isinstance(result, dict) or not isinstance(result.get("items"), list):
        raise ValueError("The model returned an invalid question and answer list")
    return result["items"]


def generate_pdf_qa():
    email = ""
    file_path = ""
    file_name = "document.pdf"
    completed_pages = 0
    total_pages = 0
    try:
        data = request.json or {}
        if data.get("token") != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        email = str(data.get("email", "")).strip().lower()
        file_path = str(data.get("filePath", "")).strip()
        if not email or not file_path or data.get("table", "chatbot_pdf_file") != "chatbot_pdf_file":
            return jsonify({"success": False, "error": "Email and PDF file path are required"}), 400

        row = supabase.table("chatbot_pdf_file").select("file_name, cache").eq("email", email).eq("file", file_path).single().execute()
        if not row.data:
            return jsonify({"success": False, "error": "PDF not found"}), 404

        file_name = row.data.get("file_name") or file_name
        cache = row.data.get("cache")
        pages = cache.get("pages") if isinstance(cache, dict) else None
        total_pages = int(cache.get("page_count", len(pages or []))) if isinstance(cache, dict) else 0
        if not isinstance(pages, list) or not pages:
            return jsonify({"success": False, "error": "Summarize the PDF pages before generating questions"}), 422

        readable_pages = [
            {"page": int(item.get("page", index + 1)), "summary": str(item.get("summary", "")).strip()}
            for index, item in enumerate(pages)
            if isinstance(item, dict)
            and str(item.get("summary", "")).strip()
            and "no extractable text was found" not in str(item.get("summary", "")).lower()
        ]
        if not readable_pages:
            return jsonify({"success": False, "error": "No extractable text was found in this PDF"}), 422

        _update_progress(email, file_path, "generating_qa", 0, total_pages, file_name, message=f"Preparing questions and answers for {len(readable_pages)} readable pages.")
        question_answers = []
        for offset in range(0, len(readable_pages), PAGES_PER_REQUEST):
            batch = readable_pages[offset:offset + PAGES_PER_REQUEST]
            page_content = "\n\n".join(f"PAGE {item['page']}\n{item['summary']}" for item in batch)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You create accurate, useful questions and answers from PDF page summaries. Never add facts that are not in the supplied summaries. Choose the number of pairs based on the information available; do not pad sparse pages or duplicate facts."},
                    {"role": "user", "content": f"Create a useful set of distinct, natural questions and concise, complete answers from these PDF page summaries. Let each page's content determine how many pairs it gets: create one for a page with one useful fact or topic, several when it contains several distinct useful facts or topics, and none when it contains no useful information. For guidance, usually create 1–5 pairs for a page, but use fewer or more when its content warrants it. Avoid trivial, repetitive, or unanswerable questions. Answers must be based only on the corresponding page summary. Return a JSON object with an 'items' array. Each item must contain integer 'page', string 'question' ending in '?', and string 'answer'. Preserve the source page number on every pair.\n\n{page_content}"},
                ],
                temperature=0.2,
                max_tokens=min(4000, 450 * len(batch)),
                response_format={"type": "json_object"},
            )
            items = _json_items(response.choices[0].message.content)
            valid_pages = {page["page"] for page in batch}
            for item in items:
                if not isinstance(item, dict) or item.get("page") not in valid_pages:
                    raise ValueError("The model returned a Q&A with an invalid PDF page number")
                question = item.get("question")
                answer = item.get("answer")
                if not isinstance(question, str) or not question.strip().endswith("?") or not isinstance(answer, str) or not answer.strip():
                    raise ValueError(f"Could not generate a complete Q&A for PDF page {item.get('page')}")
                question_answers.append({"page": item["page"], "question": question.strip(), "answer": answer.strip()})

            completed_pages = batch[-1]["page"]
            _update_progress(email, file_path, "generating_qa", completed_pages, total_pages, file_name, message=f"Generated questions and answers through page {completed_pages} of {total_pages}.")

        _update_progress(email, file_path, "complete", total_pages, total_pages, file_name, status="complete", message=f"Ready: generated {len(question_answers)} question and answer pairs from {len(readable_pages)} PDF pages.")
        return jsonify({"success": True, "questions_and_answers": question_answers})
    except Exception as error:
        print("PDF question and answer generation error:", error, file=sys.stderr)
        if email and file_path:
            try:
                _update_progress(email, file_path, "generating_qa", completed_pages, total_pages, file_name, status="failed", message=f"Failed after page {completed_pages} while generating questions and answers from the PDF.")
            except Exception as progress_error:
                print("Could not save PDF Q&A error status:", progress_error, file=sys.stderr)
        return jsonify({"success": False, "error": "Failed to generate questions and answers from every readable PDF page"}), 500
