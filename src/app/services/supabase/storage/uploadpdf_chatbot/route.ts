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
            prompt: "Summarize the Documents make sure all topics are included with the limit of 5 paragraphs",
            token: apikey,
            email: cleanEmail,
            filePath: filePath,
        });

        if (!response.success) {
            uploadedResults.push({ originalName: file.name, filePath, success: false, message: "Failed to create summary" });
            continue;
        }

        await supabaseServer
            .from("chatbot_pdf_file")
            .update([{ summary: response.data.markdown }])
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