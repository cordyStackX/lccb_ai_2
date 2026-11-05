import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import apiLinks from "@/config/conf/json_config/Api_links.json";
import { countPdfPages, getUsedPdfPages, isApiLimitReached, isBusinessPlanExpired, planPageLimit, usagePeriodStart } from "@/lib/business_plan_usage";

function parseQuestionAnswers(markdown: unknown, count: number) {
    if (typeof markdown !== "string") return null;
    try {
        const parsed: unknown = JSON.parse(markdown.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(parsed) || parsed.length !== count) return null;
        return parsed.every((item) => {
            if (!item || typeof item !== "object") return false;
            const pair = item as { question?: unknown; answer?: unknown; page?: unknown };
            return typeof pair.question === "string" && typeof pair.answer === "string"
                && (pair.page === undefined || Number.isInteger(pair.page));
        }) ? parsed as Array<{ question: string; answer: string; page?: number }> : null;
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
        if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        try {
            const parsed = new URL(cleanUrl);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
        } catch {
            return NextResponse.json({ success: false, error: "URL must use http or https" }, { status: 400 });
        }

        const isPlatformAdmin = auth.role?.toLowerCase() === "admin";
        let currentPlan = "";
        let periodStart: string | null = null;
        let usedPages = 0;
        if (!isPlatformAdmin) {
            const { data: plan, error: planError } = await supabaseServer
                .from("auth_business")
                .select("current_plan, current_limit, created_at, plan_expires_at")
                .eq("email", cleanEmail)
                .maybeSingle();
            if (planError || !plan) return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
            currentPlan = plan.current_plan;
            periodStart = usagePeriodStart(currentPlan, plan.created_at);
            if (isBusinessPlanExpired(currentPlan, plan.created_at, plan.plan_expires_at)) return NextResponse.json({ success: false, error: "Your plan has expired. Please renew or upgrade to continue." }, { status: 403 });
            if (!periodStart) return NextResponse.json({ success: false, error: "Your plan period has ended. Please upgrade your plan." }, { status: 403 });
            if (!["Free Trial", "Pro", "Enterprise"].includes(currentPlan)) return NextResponse.json({ success: false, error: "Your account plan does not allow document imports." }, { status: 403 });
            try {
                usedPages = await getUsedPdfPages(cleanEmail);
                const pageLimit = planPageLimit(currentPlan);
                if (usedPages >= pageLimit) return NextResponse.json({ success: false, error: `Your plan's ${pageLimit.toLocaleString()} page limit has been reached.` }, { status: 403 });
                if (currentPlan === "Free Trial" && await isApiLimitReached(cleanEmail, periodStart, plan.current_limit)) {
                    return NextResponse.json({ success: false, error: "Your free plan API request limit has been reached. Please upgrade your plan." }, { status: 403 });
                }
            } catch (error) {
                console.error("PDF page quota check failed:", error);
                return NextResponse.json({ success: false, error: "Unable to verify PDF page usage. Please try again." }, { status: 500 });
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
        const pdfBytes = Buffer.from(converted.data.pdf_base64, "base64");
        let pageCount: number;
        try {
            pageCount = await countPdfPages(converted.data.pdf_base64, apiUrl, token);
            if (!isPlatformAdmin) {
                const pageLimit = planPageLimit(currentPlan);
                if (usedPages + pageCount > pageLimit) {
                    return NextResponse.json({ success: false, error: `This document exceeds your plan's ${pageLimit.toLocaleString()} page limit. You have ${Math.max(0, pageLimit - usedPages).toLocaleString()} pages remaining.` }, { status: 403 });
                }
            }
        } catch (error) {
            console.error("PDF page quota check failed:", error);
            return NextResponse.json({ success: false, error: "Unable to verify PDF page usage. Please try again." }, { status: 500 });
        }
        const filePath = `uploads/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabaseServer.storage.from("chatbot_pdfs").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: false });
        if (uploadError) return NextResponse.json({ success: false, error: "Failed to upload converted PDF" }, { status: 500 });

        const { data: savedDocument, error: insertError } = await supabaseServer
            .from("chatbot_pdf_file")
            .insert([{ file: filePath, email: cleanEmail, file_name: fileName, page_count: pageCount }])
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

        const qaResponse = await Fetch_to(`${apiUrl}generate-pdf-qa`, { token, email: cleanEmail, filePath, table: "chatbot_pdf_file" });
        const rawQuestionAnswers = qaResponse.data?.questions_and_answers;
        if (!qaResponse.success || !Array.isArray(rawQuestionAnswers) || rawQuestionAnswers.length === 0) {
            return fail(qaResponse.message || "Failed to generate questions and answers from the document content");
        }
        const questionsAndAnswers = parseQuestionAnswers(JSON.stringify(rawQuestionAnswers), rawQuestionAnswers.length);
        if (!questionsAndAnswers) return fail("The generated page-by-page questions and answers were invalid");
        const suggestedQuestions = questionsAndAnswers.map(({ question }) => question);

        const summary = JSON.stringify(questionsAndAnswers);
        const { error: updateError } = await supabaseServer.from("chatbot_pdf_file")
            .update({ summary, suggest: JSON.stringify(suggestedQuestions) }).eq("id", savedDocument.id);
        if (updateError) return fail("Failed to save questions and answers", 500);

        const todayStart = new Date().toISOString().split("T")[0];
        const tomorrowStart = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const { data: dailyUsage, error: usageError } = await supabaseServer.from("system_logs")
            .select("uploaded_pdf").eq("request", cleanEmail).gte("created_at", todayStart).lt("created_at", tomorrowStart).maybeSingle();
        if (!usageError) {
            if (dailyUsage) {
                await supabaseServer.from("system_logs").update({ uploaded_pdf: Number(dailyUsage.uploaded_pdf ?? 0) + pageCount })
                    .eq("request", cleanEmail).gte("created_at", todayStart).lt("created_at", tomorrowStart);
            } else {
                await supabaseServer.from("system_logs").insert({ request: cleanEmail, uploaded_pdf: pageCount });
            }
        }

        return NextResponse.json({ success: true, message: "Web page converted and saved as a PDF", link: { ...savedDocument, summary, suggest: JSON.stringify(suggestedQuestions) } });
    } catch (error) {
        console.error("generate_link_chatbot POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
