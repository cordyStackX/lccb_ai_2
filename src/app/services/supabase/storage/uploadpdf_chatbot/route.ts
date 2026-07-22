import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";
import { Fetch_to } from "@/utilities";
import api_links from "@/config/conf/json_config/Api_links.json";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = (await req.formData()) as unknown as globalThis.FormData;
    const entries = form.getAll("file");
    const email = (form.get("email") as string) || "";
    const cleanEmail = email.trim().toLowerCase();

    if (!entries || entries.length === 0) return NextResponse.json({ success: false, error: "No PDF files detected" }, { status: 400 });
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const files = entries.filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) return NextResponse.json({ success: false, error: "PDF Not Detected" }, { status: 404 });

    const invalidFiles = files.filter((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
    if (invalidFiles.length > 0) {
        return NextResponse.json({ success: false, error: `Invalid PDF file: ${invalidFiles.map((file) => file.name).join(", ")}` }, { status: 400 });
    }

    const { data: limit_pdf, error: limit_pdfErr } = await supabaseServer
        .from("chatbot_pdf_file")
        .select("*")
        .eq("email", email);
    
    if (limit_pdfErr) {
        console.error("Supabase Query Error: ", limit_pdfErr);
        return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
    }

    const { data: planRow, error: planError } = await supabaseServer
        .from("auth")
        .select("current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (planError || !planRow) {
        console.error("Supabase Query Error: ", planError);
        return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
    }

    const { current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb } = planRow;

    if (current_plan === "Free Tier") {

        const { data: logRows, error: logError } = await supabaseServer
            .from("system_logs")
            .select("api_request, uploaded_pdf")
            .eq("request", cleanEmail);

        if (logError) {
            console.error("Supabase Query Error: ", logError);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const totalApiRequest = (logRows ?? []).reduce((sum, row) => sum + (row.api_request ?? 0), 0);


        if (limit_pdf.length + files.length > Number(current_pdf_limit)) {
            return NextResponse.json(
                { success: false, error: "Current plan already reach limit, upgrade plan now" },
                { status: 403 }
            );
        }

        if (totalApiRequest >= Number(current_limit)) {
            return NextResponse.json(
                { success: false, error: "Current plan already reach limit, upgrade plan now" },
                { status: 403 }
            );
        }

        const maxMb = Number(current_pdf_limit_per_mb);
        const oversizedFiles = files.filter((file) => file.size / (1024 * 1024) > maxMb);

        if (oversizedFiles.length > 0) {
            return NextResponse.json(
                { success: false, error: `Current plan already reach limit, upgrade plan to upload >${maxMb}MB` },
                { status: 403 }
            );
        }

    } else if (current_plan === "Pro") {
        // Pro tier — no limit enforcement for now
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
    const apiUrl = process.env.RENDER_API || api_links.python_links;
    const apikey = process.env.API_KEY;
    const uploadedResults: Array<{ originalName: string; filePath?: string; success: boolean; message?: string }> = [];

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

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
            .insert([{ file: filePath, email: cleanEmail, file_name: file.name }]);

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

        const response = await Fetch_to(`${apiUrl}generate_md_summary`, {
            prompt: "Summarize the Documents make sure all topics are included",
            token: apikey,
            email: cleanEmail,
            filePath: filePath,
            table: "chatbot_pdf_file"
        });

        if (!response.success) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to create summary" });
            continue;
        }

        await supabaseServer
            .from("chatbot_pdf_file")
            .update([{ summary: response.data.markdown }])
            .eq("file", filePath);
        
        const response_suggest = await Fetch_to(`${apiUrl}generate_md_summary`, {
            prompt: `Read this PDF and generate questions a user might realistically ask about it.

        Rules:
        - Generate ONE question per distinct topic or section covered in the PDF.
        - If the PDF is short or covers only one topic, generate just ONE question. Do not pad the list with filler or repetitive questions.
        - If the PDF covers multiple distinct topics, generate one question per topic, up to a maximum of 8 questions.
        - Each question must be a single, natural sentence a real user would type, ending in a question mark.
        - Do not include answers, numbering, or duplicate/near-duplicate questions.

        Respond with ONLY a raw JSON array of strings. No markdown fences, no explanation, no extra text before or after.

        CORRECT example output (multi-topic PDF):
        ["What are the requirements for enrollment?", "What courses are offered under the SBIT program?", "How do I apply for a scholarship?"]

        CORRECT example output (single-topic PDF):
        ["What are the requirements for enrollment?"]

        WRONG (do NOT do this — extra text or preamble):
        Here is a question: ["What are the requirements?"]

        WRONG (do NOT do this — objects instead of plain strings):
        [{"question": "What are the requirements?"}]

        Your output must be a JSON array of plain strings matching the CORRECT examples exactly — nothing else.`,
            token: apikey,
            email: cleanEmail,
            filePath: filePath,
            table: "chatbot_pdf_file"
        });

        if (!response_suggest.success) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to create summary" });
            continue;
        }

        await supabaseServer
            .from("chatbot_pdf_file")
            .update([{ suggest: response_suggest.data.markdown }])
            .eq("file", filePath);

        uploadedResults.push({ originalName: file.name, filePath, success: true });
    }

    const successCount = uploadedResults.filter((result) => result.success).length;

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
            const record_add = (record.uploaded_pdf ?? 0) + successCount;
            await supabaseServer
                .from("system_logs")
                .update({ uploaded_pdf: record_add })
                .eq("request", cleanEmail);
        } else {
            await supabaseServer
                .from("system_logs")
                .insert([{
                    request: cleanEmail,
                    uploaded_pdf: successCount,
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