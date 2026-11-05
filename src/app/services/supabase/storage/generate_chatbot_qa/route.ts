import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import apiLinks from "@/config/conf/json_config/Api_links.json";
import { isBusinessPlanExpired } from "@/lib/business_plan_usage";

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
        if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        if (action === "answer" && (!question || typeof question !== "string")) {
            return NextResponse.json({ success: false, error: "A question is required" }, { status: 400 });
        }

        if (auth.role?.toLowerCase() !== "admin") {
            const { data: plan, error: planError } = await supabaseServer.from("auth_business")
                .select("current_plan, created_at, plan_expires_at").eq("email", cleanEmail).maybeSingle();
            if (planError || !plan) return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
            if (isBusinessPlanExpired(plan.current_plan, plan.created_at, plan.plan_expires_at)) {
                return NextResponse.json({ success: false, error: "Your plan has expired. Please renew or upgrade to continue." }, { status: 403 });
            }
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

        if (action === "questions") {
            const generatedQa = await Fetch_to(`${apiUrl}generate-pdf-qa`, {
                token,
                email: cleanEmail,
                filePath: document.file,
                table: "chatbot_pdf_file",
            });
            const items = generatedQa.data?.questions_and_answers;
            if (!generatedQa.success || !Array.isArray(items) || items.length === 0) {
                return NextResponse.json({ success: false, error: generatedQa.message || "Failed to generate questions from the document content" }, { status: 422 });
            }
            return NextResponse.json({ success: true, questions: items });
        }

        const prompt = `Answer this question using only the PDF: ${question.trim()}
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

        return NextResponse.json({ success: true, answer: generated.data.markdown.trim() });
    } catch (error) {
        console.error("generate_chatbot_qa POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
