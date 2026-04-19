import sys
from flask import request, jsonify
from .context import EXPECTED_API_KEY, client, supabase


def generate_md_chatbot():
    try:
        data = request.json or {}
        received_token = data.get("token")
        prompt = data.get("prompt", "")
        last_user_response = str(data.get("last_user_response", "")).strip()
        last_ai_response = str(data.get("last_ai_response", "")).strip()
        email = data.get("email")
        # No pdf_id needed; use all summaries

        # Validate token
        if received_token != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        if not prompt:
            return jsonify({"success": False, "error": "Prompt cannot be empty"}), 404
        if not email:
            return jsonify({"success": False, "error": "Email not found"}), 404
        # --- Get summaries from Supabase ---
        rows = supabase.table("chatbot_pdf_file").select("id, file_name, summary").execute()
        if not rows.data:
            return jsonify({"success": False, "error": "No summaries found"}), 404

        user = supabase.table("auth").select("year, role").eq("email", email).single().execute()
        if not user.data:
            return jsonify({"success": False, "error": "User not found"}), 404

        role = "admin"
        year = "admin2026"

        summaries = []
        for item in rows.data:
            summary_text = (item.get("summary") or "").strip()
            if summary_text:
                label = item.get("file_name") or f"PDF {item.get('id')}"
                summaries.append(f"[{label}]\n{summary_text}")

        if not summaries:
            return jsonify({"success": False, "error": "PDF summaries not found"}), 404

        # --- Read Txt prompt template ---
        with open("python/python_txt_file/prompt.md", "r", encoding="utf-8") as f:
            template = f.read()

        with open("python/python_txt_file/system.md", "r", encoding="utf-8") as f:
            system_role = f.read()

        if not template:
            return jsonify({ "success" : False, "message" : "template not found" }), 404
        
        if not system_role:
            return jsonify({ "success" : False, "message" : "template not found" }), 404

        # Reduce token load by chunking large summary sets.
        chunk_size = 8
        combined_text = "\n\n".join(summaries)
        if len(summaries) > chunk_size:
            chunk_summaries = []
            for i in range(0, len(summaries), chunk_size):
                chunk_text = "\n\n".join(summaries[i : i + chunk_size])
                chunk_prompt = template.format(
                    documents=chunk_text,
                    question=prompt,
                )

                chunk_response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": system_role},
                        {"role": "user", "content": chunk_prompt},
                    ],
                    temperature=0.4,
                    max_tokens=800,
                )
                chunk_md = (chunk_response.choices[0].message.content or "").strip()
                if chunk_md:
                    chunk_summaries.append(chunk_md)

            if chunk_summaries:
                combined_text = "\n\n".join(chunk_summaries)

        # --- Strict instruction: only answer based on PDF summary ---
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
            year=year,
        )

        # --- Call OpenAI with relevant context ---
        response = client.chat.completions.create(
            model="gpt-4o-2024-05-13",
            messages=[
                {"role": "system", "content": systemRole},
                {"role": "user", "content": final_prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        md = response.choices[0].message.content or ""

        return jsonify({"success": True, "markdown": md})

    except Exception as e:
        print("🔥 OpenAI Error:", e, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500
