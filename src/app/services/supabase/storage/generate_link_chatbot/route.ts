import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import apiLinks from "@/config/conf/json_config/Api_links.json";

function parseQuestions(markdown: unknown): string[] | null {
    if (typeof markdown !== "string") return null;
    try {
        const parsed: unknown = JSON.parse(markdown.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 8) return null;
        const questions = parsed.map((value) => typeof value === "string" ? value.trim() : "");
        return questions.every((question) => question.endsWith("?") && question.length <= 300) ? questions : null;
    } catch {
        return null;
    }
}

function parseQuestionAnswers(markdown: unknown, count: number) {
    if (typeof markdown !== "string") return null;
    try {
        const parsed: unknown = JSON.parse(markdown.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(parsed) || parsed.length !== count) return null;
        return parsed.every((item) => {
            if (!item || typeof item !== "object") return false;
            const pair = item as { question?: unknown; answer?: unknown };
            return typeof pair.question === "string" && typeof pair.answer === "string";
        }) ? parsed as Array<{ question: string; answer: string }> : null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await Security(req);
        if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { url, email } = await req.json().catch(() => ({}));
        const cleanUrl = typeof url === "string" ? url.trim() : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!cleanUrl || !cleanEmail) return NextResponse.json({ success: false, error: "URL and email are required" }, { status: 400 });
        try {
            const parsed = new URL(cleanUrl);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
        } catch {
            return NextResponse.json({ success: false, error: "URL must use http or https" }, { status: 400 });
        }

        const { data: documents, error: documentError } = await supabaseServer.from("chatbot_pdf_file").select("id").eq("email", cleanEmail);
        const { data: plan, error: planError } = await supabaseServer
            .from("auth_business")
            .select("current_plan, current_limit, current_pdf_limit, created_at")
            .eq("email", cleanEmail)
            .maybeSingle();
        if (documentError || planError || !plan) return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });

        if (plan.current_plan === "Free Trial" || plan.current_plan === "Pro") {
            const trialExpiry = new Date(plan.created_at);
            trialExpiry.setMonth(trialExpiry.getMonth() + 1);
            if (plan.current_plan === "Free Trial" && new Date() >= trialExpiry) {
                return NextResponse.json({ success: false, error: "1 month free trial already reached, please upgrade plan now" }, { status: 403 });
            }
            if ((documents?.length ?? 0) + 1 > Number(plan.current_pdf_limit)) {
                return NextResponse.json({ success: false, error: "Current plan already reach limit, upgrade plan now" }, { status: 403 });
            }
            const { data: logs, error: logError } = await supabaseServer.from("system_logs").select("api_request").eq("request", cleanEmail);
            if (logError) return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            if ((logs ?? []).reduce((total, row) => total + (row.api_request ?? 0), 0) >= Number(plan.current_limit)) {
                return NextResponse.json({ success: false, error: "Current plan already reach limit, upgrade plan now" }, { status: 403 });
            }
        }

        const token = process.env.API_KEY;
        if (!token) return NextResponse.json({ success: false, error: "API is not configured" }, { status: 500 });
        const apiUrl = process.env.RENDER_API || apiLinks.python_links;
        const converted = await Fetch_to(`${apiUrl}convert-link-to-pdf-chatbot`, { token, url: cleanUrl });
        if (!converted.success || typeof converted.data?.pdf_base64 !== "string" || typeof converted.data?.file_name !== "string") {
            return NextResponse.json({ success: false, error: converted.message || "Unable to convert the web page to PDF" }, { status: 422 });
        }

        const fileName = converted.data.file_name;
        const filePath = `uploads/${Date.now()}_${fileName}`;
        const pdfBytes = Buffer.from(converted.data.pdf_base64, "base64");
        const { error: uploadError } = await supabaseServer.storage.from("chatbot_pdfs").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: false });
        if (uploadError) return NextResponse.json({ success: false, error: "Failed to upload converted PDF" }, { status: 500 });

        const { data: savedDocument, error: insertError } = await supabaseServer
            .from("chatbot_pdf_file")
            .insert([{ file: filePath, email: cleanEmail, file_name: fileName }])
            .select("id, file, file_name")
            .single();
        if (insertError || !savedDocument) {
            await supabaseServer.storage.from("chatbot_pdfs").remove([filePath]);
            return NextResponse.json({ success: false, error: "Failed to save converted PDF" }, { status: 500 });
        }

        const fail = async (message: string, status = 502) => {
            await supabaseServer.storage.from("chatbot_pdfs").remove([filePath]);
            await supabaseServer.from("chatbot_pdf_file").delete().eq("id", savedDocument.id);
            return NextResponse.json({ success: false, error: message }, { status });
        };

        const download = await Fetch_to(`${apiUrl}download-file`, { token, filePath });
        if (!download.success) return fail(download.message || "Could not read converted PDF");
        const cache = await Fetch_to(`${apiUrl}generate-pdf-cache`, { token, email: cleanEmail, filePath, table: "chatbot_pdf_file" });
        if (!cache.success) return fail(cache.message || "Failed to summarize converted PDF pages");

        const suggested = await Fetch_to(`${apiUrl}generate_md_summary`, {
            token, email: cleanEmail, filePath, table: "chatbot_pdf_file",
            prompt: "Read this document and generate up to 8 distinct, natural user questions. Return ONLY a raw JSON array of question strings. Every question must end with a question mark.",
        });
        const questions = suggested.success ? parseQuestions(suggested.data?.markdown) : null;
        if (!questions) return fail(suggested.message || "Failed to create suggested questions");

        const answers = await Fetch_to(`${apiUrl}generate_md_summary`, {
            token, email: cleanEmail, filePath, table: "chatbot_pdf_file",
            prompt: `Answer every question below using only the document. Return ONLY a raw JSON array with exactly ${questions.length} objects in the same order. Every object must have exactly "question" and "answer" string keys.\n\n${questions.map((question, index) => `${index + 1}. ${question}`).join("\n")}`,
        });
        const questionsAndAnswers = answers.success ? parseQuestionAnswers(answers.data?.markdown, questions.length) : null;
        if (!questionsAndAnswers) return fail(answers.message || "Failed to create answers");

        const summary = JSON.stringify(questionsAndAnswers);
        const { error: updateError } = await supabaseServer.from("chatbot_pdf_file")
            .update({ summary, suggest: JSON.stringify(questions) }).eq("id", savedDocument.id);
        if (updateError) return fail("Failed to save questions and answers", 500);

        return NextResponse.json({ success: true, message: "Web page converted and saved as a PDF", link: { ...savedDocument, summary, suggest: JSON.stringify(questions) } });
    } catch (error) {
        console.error("generate_link_chatbot POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
