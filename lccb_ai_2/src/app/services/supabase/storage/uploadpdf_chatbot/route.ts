import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import api_links from "@/config/conf/json_config/Api_links.json";
import { countPdfPages, getUsedPdfPages, isApiLimitReached, isBusinessPlanExpired, planPageLimit, usagePeriodStart } from "@/lib/business_plan_usage";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = (await req.formData()) as unknown as globalThis.FormData;
    const entries = form.getAll("file");
    const email = (form.get("email") as string) || "";
    const cleanEmail = email.trim().toLowerCase();
    if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    if (!entries || entries.length === 0) return NextResponse.json({ success: false, error: "No PDF files detected" }, { status: 400 });
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const files = entries.filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) return NextResponse.json({ success: false, error: "PDF Not Detected" }, { status: 404 });

    const invalidFiles = files.filter((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
    if (invalidFiles.length > 0) {
        return NextResponse.json({ success: false, error: `Invalid PDF file: ${invalidFiles.map((file) => file.name).join(", ")}` }, { status: 400 });
    }

    const isPlatformAdmin = auth.role?.toLowerCase() === "admin";
    let current_plan = "";
    let current_limit: number | null = null;
    let periodStart: string | null = null;
    if (!isPlatformAdmin) {
        const { data: planRow, error: planError } = await supabaseServer
            .from("auth_business")
            .select("current_plan, current_limit, created_at, plan_expires_at")
            .eq("email", cleanEmail)
            .maybeSingle();

        if (planError || !planRow) {
            console.error("Supabase Query Error: ", planError);
            return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
        }

        ({ current_plan, current_limit } = planRow);
        if (isBusinessPlanExpired(current_plan, planRow.created_at, planRow.plan_expires_at)) {
            return NextResponse.json({ success: false, error: "Your plan has expired. Please renew or upgrade to continue." }, { status: 403 });
        }
        periodStart = usagePeriodStart(current_plan, planRow.created_at);
        if (!periodStart) return NextResponse.json({ success: false, error: "Your plan period has ended. Please upgrade your plan." }, { status: 403 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;
    const apikey = process.env.API_KEY;
    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    let incomingPageCount = 0;
    const pageCounts = new Map<File, number>();
    try {
        for (const file of files) {
            const pageCount = await countPdfPages(Buffer.from(await file.arrayBuffer()).toString("base64"), apiUrl, apikey);
            pageCounts.set(file, pageCount);
            incomingPageCount += pageCount;
        }
        if (!isPlatformAdmin) {
            const usedPages = await getUsedPdfPages(cleanEmail);
            const pageLimit = planPageLimit(current_plan);
            if (usedPages + incomingPageCount > pageLimit) {
                return NextResponse.json({ success: false, error: `This upload exceeds your plan's ${pageLimit.toLocaleString()} page limit. You have ${Math.max(0, pageLimit - usedPages).toLocaleString()} pages remaining.` }, { status: 403 });
            }
            if (current_plan === "Free Trial" && await isApiLimitReached(cleanEmail, periodStart!, current_limit)) {
                return NextResponse.json({ success: false, error: "Your free plan API request limit has been reached. Please upgrade your plan." }, { status: 403 });
            }
        }
    } catch (error) {
        console.error("PDF page quota check failed:", error);
        return NextResponse.json({ success: false, error: "Unable to verify PDF page usage. Please try again." }, { status: 500 });
    }

    const incomingNames = files.map((file) => file.name);
    const seenNames = new Set<string>();
    const duplicateBatchNames = new Set<string>();

    incomingNames.forEach((name) => {
        const key = name.toLowerCase();
        if (seenNames.has(key)) duplicateBatchNames.add(name);
        seenNames.add(key);
    });

    if (duplicateBatchNames.size > 0) {
        return NextResponse.json(
            { success: false, error: `Duplicate PDF names in upload: ${Array.from(duplicateBatchNames).join(", ")}` },
            { status: 409 }
        );
    }

    const { data: existingNames, error: existingError } = await supabaseServer
        .from("chatbot_pdf_file")
        .select("file_name")
        .eq("email", cleanEmail)
        .in("file_name", incomingNames);

    if (existingError) {
        console.error("Supabase Query Error: ", existingError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (existingNames && existingNames.length > 0) {
        const names = existingNames
            .map((item: { file_name?: string }) => item.file_name)
            .filter(Boolean)
            .join(", ");

        return NextResponse.json({ success: false, error: `PDF name already exists: ${names}` }, { status: 409 });
    }

    const bucketName = "chatbot_pdfs";
    const uploadedResults: Array<{ id?: number; originalName: string; filePath?: string; suggest?: string; summary?: string; pageCount?: number; success: boolean; message?: string }> = [];

    for (const file of files) {
        const filePath = `uploads/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabaseServer.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase Upload Error: ", uploadError);
            uploadedResults.push({ originalName: file.name, success: false, message: "Failed to upload PDF" });
            continue;
        }

        const { error: insertError } = await supabaseServer
            .from("chatbot_pdf_file")
            .insert([{ file: filePath, email: cleanEmail, file_name: file.name, page_count: pageCounts.get(file) }]);

        if (insertError) {
            console.error("Supabase Insert Error: ", insertError);
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to save PDF record" });
            continue;
        }

        const response1 = await Fetch_to(`${apiUrl}download-file`, { token: apikey, filePath: filePath });
        if (!response1.success) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "3rd party failed to read the data" });
            continue;
        }

        const cacheResponse = await Fetch_to(`${apiUrl}generate-pdf-cache`, {
            token: apikey,
            email: cleanEmail,
            filePath,
            table: "chatbot_pdf_file",
        });
        if (!cacheResponse.success) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: cacheResponse.message || "Failed to summarize every PDF page" });
            continue;
        }
        
        const qaResponse = await Fetch_to(`${apiUrl}generate-pdf-qa`, {
            token: apikey,
            email: cleanEmail,
            filePath,
            table: "chatbot_pdf_file",
        });
        const rawQuestionAnswers = qaResponse.data?.questions_and_answers;
        if (!qaResponse.success || !Array.isArray(rawQuestionAnswers) || rawQuestionAnswers.length === 0) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: qaResponse.message || "Failed to generate questions and answers from the document content" });
            continue;
        }

        const questionsAndAnswers = rawQuestionAnswers.filter((item: unknown) => {
            if (!item || typeof item !== "object") return false;
            const pair = item as { question?: unknown; answer?: unknown; page?: unknown };
            return typeof pair.question === "string" && pair.question.trim().endsWith("?")
                && typeof pair.answer === "string" && pair.answer.trim().length > 0
                && Number.isInteger(pair.page);
        }) as Array<{ question: string; answer: string; page: number }>;
        if (questionsAndAnswers.length !== rawQuestionAnswers.length) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to validate generated questions and answers" });
            continue;
        }

        const summary = JSON.stringify(questionsAndAnswers);

        const { error: updateError } = await supabaseServer
            .from("chatbot_pdf_file")
            .update({ summary, suggest: JSON.stringify(questionsAndAnswers.map(({ question }) => question)) })
            .eq("file", filePath);

        if (updateError) {
            console.error("Supabase Update Error: ", updateError);
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to save questions and answers" });
            continue;
        }

        const { data: savedDocument } = await supabaseServer
            .from("chatbot_pdf_file")
            .select("id")
            .eq("file", filePath)
            .maybeSingle();

        uploadedResults.push({
            id: savedDocument?.id,
            originalName: file.name,
            filePath,
            suggest: JSON.stringify(questionsAndAnswers.map(({ question }) => question)),
            summary,
            pageCount: pageCounts.get(file),
            success: true,
        });
    }

    const successCount = uploadedResults.filter((result) => result.success).length;
    const successPageCount = uploadedResults.reduce((total, result) => total + (result.success ? result.pageCount ?? 0 : 0), 0);

    if (successCount > 0) {
        const { data: record, error: record_err } = await supabaseServer
            .from("system_logs")
            .select("uploaded_pdf, created_at")
            .eq("request", cleanEmail)
            .gte("created_at", new Date().toISOString().split("T")[0])
            .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
            .maybeSingle();

        if (record_err) {
            console.error("Supabase Query Error: ", record_err);
        } else if (record) {
            const record_add = (record.uploaded_pdf ?? 0) + successPageCount;
            await supabaseServer
                .from("system_logs")
                .update({ uploaded_pdf: record_add })
                .eq("request", cleanEmail);
        } else {
            await supabaseServer
                .from("system_logs")
                .insert([{
                    request: cleanEmail,
                    uploaded_pdf: successPageCount,
                }]);
        }
    }

    const hasFailure = uploadedResults.some((result) => !result.success);
    return NextResponse.json(
        {
            success: successCount > 0,
            message: hasFailure ? "Some PDFs failed to upload" : "Files uploaded successfully",
            uploaded: uploadedResults,
        },
        { status: successCount > 0 ? 200 : 409 }
    );

}
