import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import apiLinks from "@/config/conf/json_config/Api_links.json";

function parseQuestions(markdown: unknown): string[] | null {
    if (typeof markdown !== "string") return null;
    try {
        const questions: unknown = JSON.parse(markdown.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(questions) || questions.length === 0 || questions.length > 8) return null;
        const clean = questions.map((question) => typeof question === "string" ? question.trim() : "");
        return clean.every((question) => question.length > 0 && question.endsWith("?")) ? clean : null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await Security(req);
        if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id, email, action, question } = await req.json();
        const documentId = Number(id);
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!Number.isInteger(documentId) || !cleanEmail || (action !== "questions" && action !== "answer")) {
            return NextResponse.json({ success: false, error: "Invalid generation request" }, { status: 400 });
        }
        if (action === "answer" && (!question || typeof question !== "string")) {
            return NextResponse.json({ success: false, error: "A question is required" }, { status: 400 });
        }

        const { data: document, error: documentError } = await supabaseServer
            .from("chatbot_pdf_file")
            .select("file")
            .eq("id", documentId)
            .eq("email", cleanEmail)
            .maybeSingle();
        if (documentError || !document?.file) {
            return NextResponse.json({ success: false, error: "PDF document not found" }, { status: 404 });
        }

        const token = process.env.API_KEY;
        if (!token) return NextResponse.json({ success: false, error: "API is not configured" }, { status: 500 });
        const apiUrl = process.env.RENDER_API || apiLinks.python_links;
        const download = await Fetch_to(`${apiUrl}download-file`, { token, filePath: document.file });
        if (!download.success) return NextResponse.json({ success: false, error: download.message || "Could not read the PDF" }, { status: 422 });

        const cache = await Fetch_to(`${apiUrl}generate-pdf-cache`, {
            token,
            email: cleanEmail,
            filePath: document.file,
            table: "chatbot_pdf_file",
        });
        if (!cache.success) return NextResponse.json({ success: false, error: cache.message || "Could not prepare the PDF page cache" }, { status: 422 });

        const prompt = action === "questions"
            ? `Read this PDF and generate questions a user might realistically ask about it.
Rules: generate one question per distinct topic, up to 8; do not include answers, numbering, duplicates, or markdown; every question must end in a question mark.
Respond ONLY with a raw JSON array of strings.`
            : `Answer this question using only the PDF: ${question.trim()}
Give a complete, factual answer. Respond ONLY with the answer text; do not include the question, a preamble, or markdown.`;
        const generated = await Fetch_to(`${apiUrl}generate_md_summary`, {
            token,
            prompt,
            email: cleanEmail,
            filePath: document.file,
            table: "chatbot_pdf_file",
        });
        if (!generated.success || typeof generated.data?.markdown !== "string") {
            return NextResponse.json({ success: false, error: generated.message || "Generation failed" }, { status: 502 });
        }

        if (action === "questions") {
            const questions = parseQuestions(generated.data.markdown);
            if (!questions) return NextResponse.json({ success: false, error: "Failed to parse generated questions" }, { status: 502 });
            return NextResponse.json({ success: true, questions });
        }
        return NextResponse.json({ success: true, answer: generated.data.markdown.trim() });
    } catch (error) {
        console.error("generate_chatbot_qa POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
