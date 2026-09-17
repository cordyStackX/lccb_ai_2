import os
import sys
from flask import request, jsonify
from PyPDF2 import PdfReader
from .context import EXPECTED_API_KEY, client, supabase


def generate_md_summary():
    try:
        data = request.json or {}
        received_token = data.get("token")
        prompt = data.get("prompt", "")
        last_user_response = str(data.get("last_user_response", "")).strip()
        last_ai_response = str(data.get("last_ai_response", "")).strip()
        email = data.get("email")
        file = data.get("filePath")  # new: PDF id
        table = data.get("table")

        # Validate token
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        if not prompt:
            return jsonify({"success": False, "error": "Prompt cannot be empty"}), 400
        if not file:
            return jsonify({"success": False, "error": "file_id is required"}), 400
        if not email:
            return jsonify({"success": False, "error": "Email not found"}), 400

        # The page cache is built during upload. It preserves coverage of long PDFs
        # instead of relying on a few arbitrary four-page chunks.
        row = supabase.table(table).select("file_name, cache").eq("file", file).single().execute()
        if not row.data:
            return jsonify({"success": False, "error": "PDF not found"}), 404

        user = supabase.table("auth").select("id, role").eq("email", email).single().execute()
        if not user.data:
            return jsonify({"success": False, "error": "User not found"}), 404

        file_name = row.data["file_name"]
        tmp_path = f"/tmp/{email}_{file_name}"
        role = user.data["role"]

        # --- Check if file exists in tmp/ directory ---
        if not os.path.exists(tmp_path):
            return jsonify({
                "success": False,
                "error": "File not found in tmp/. Please download it first using /download-file",
            }), 404

        cache = row.data.get("cache")
        cached_pages = cache.get("pages") if isinstance(cache, dict) else None
        if isinstance(cached_pages, list) and cached_pages:
            chunks = [
                {"text": str(page.get("summary", "")).strip(), "pages": str(page.get("page", ""))}
                for page in cached_pages
                if isinstance(page, dict) and str(page.get("summary", "")).strip()
            ]
        else:
            # Backward-compatible fallback for PDFs uploaded before the cache column.
            reader = PdfReader(tmp_path)
            chunks = [
                {"text": (page.extract_text() or "").strip(), "pages": str(index)}
                for index, page in enumerate(reader.pages, start=1)
                if (page.extract_text() or "").strip()
            ]

        if not chunks:
            return jsonify({"success": False, "error": "No readable text was found in the PDF"}), 422

        # --- Read Txt prompt template ---
        with open("python/python_txt_file/prompt.md", "r", encoding="utf-8") as f:
            template = f.read()

        with open("python/python_txt_file/system.md", "r", encoding="utf-8") as f:
            system_role = f.read()

        if not template:
            return jsonify({ "success" : False, "message" : "template not found" }), 404
        
        if not system_role:
            return jsonify({ "success" : False, "message" : "template not found" }), 404

        # Use every cached page for document-wide tasks (such as suggested questions).
        # For a targeted answer, choose the relevant page summaries first.
        chunk_summaries = "\n\n".join([
            f"Chunk {idx+1} (Pages {chunk['pages']}):\n{chunk['text'][:500]}..."
            for idx, chunk in enumerate(chunks)
        ])

        relevance_prompt = f"""Given this question: \"{prompt}\"
Here are summaries of document chunks:
{chunk_summaries}

Which chunks (by number) are most relevant to answer this question? 
Respond with ONLY comma-separated numbers (e.g., \"1,3,4\"). If all chunks seem relevant, say \"ALL\"."""

        document_wide_task = "generate questions" in prompt.lower() or "every single question" in prompt.lower()
        if document_wide_task:
            relevant_indices_str = "ALL"
        else:
            relevance_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a document analyst. Identify relevant document sections."},
                    {"role": "user", "content": relevance_prompt},
                ],
                temperature=0.3,
                max_tokens=50,
            )
            relevant_indices_str = relevance_response.choices[0].message.content.strip()

        # --- Step 2: Use only relevant chunks ---
        if relevant_indices_str.upper() == "ALL":
            relevant_chunks = chunks
        else:
            try:
                relevant_indices = [int(x.strip()) - 1 for x in relevant_indices_str.split(",")]
                relevant_chunks = [chunks[i] for i in relevant_indices if 0 <= i < len(chunks)]
            except Exception:
                # Fallback: use all chunks if parsing fails
                relevant_chunks = chunks

        # Combine relevant chunks
        combined_text = "\n\n".join([
            f"[Pages {chunk['pages']}]\n{chunk['text']}"
            for chunk in relevant_chunks
        ])

        # --- Strict instruction: only answer based on PDF ---
        final_prompt = template.format(
            documents=combined_text,
            question=prompt,
        )

        if last_user_response:
            final_prompt += (
                "\n\nConversation context (latest previous user message):\n"
                f"{last_user_response}"
            )

        if last_ai_response:
            final_prompt += (
                "\n\nConversation context (latest previous AI response):\n"
                f"{last_ai_response}"
            )

        systemRole = system_role.format(
            role=role,
            name="admin",
            user_id=1,
            method="summaries",
            chat_bot_name=""
        )

        # --- Call OpenAI with relevant context ---
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": systemRole},
                {"role": "user", "content": final_prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        md = response.choices[0].message.content or ""

        return jsonify({"success": True, "markdown": md})

    except Exception as e:
        print("🔥 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
