import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";


export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = (await req.formData()) as unknown as globalThis.FormData;
    // accept multiple files under the key 'file'
    const entries = form.getAll("file");
    const email = (form.get("email") as string) || "";

    const cleanEmail = email.trim().toLowerCase();

    if (!entries || entries.length === 0) return NextResponse.json({ success: false, error: "No PDF files detected" }, { status: 400 });
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const bucketName = "pdfs";
    const uploadedResults: Array<{ originalName: string; storedName?: string; success: boolean; message?: string }> = [];

    const incomingNames: string[] = [];
    for (const entry of entries) {
        if (entry instanceof File) {
            incomingNames.push(entry.name);
        }
    }

    // If duplicate names are present inside the same request, reject the whole request.
    const seen = new Set<string>();
    const duplicateInBatch = new Set<string>();
    for (const name of incomingNames) {
        const key = name.toLowerCase();
        if (seen.has(key)) duplicateInBatch.add(name);
        seen.add(key);
    }
    if (duplicateInBatch.size > 0) {
        return NextResponse.json(
            { success: false, error: `Duplicate PDF names in upload: ${Array.from(duplicateInBatch).join(", ")}` },
            { status: 409 }
        );
    }

    // If any incoming file_name already exists for this user, reject the whole request.
    const { data: existingNames, error: existingErr } = await supabaseServer
        .from("pdf_file")
        .select("file_name")
        .eq("email", cleanEmail)
        .in("file_name", incomingNames);

    if (existingErr) {
        console.error("Supabase Query Error:", existingErr);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (existingNames && existingNames.length > 0) {
        const names = existingNames
            .map((item: { file_name?: string }) => item.file_name)
            .filter(Boolean)
            .join(", ");
        return NextResponse.json(
            { success: false, error: `PDF name already exists: ${names}` },
            { status: 409 }
        );
    }

    for (const entry of entries) {
        if (!(entry instanceof File)) {
            uploadedResults.push({ originalName: String(entry), success: false, message: "Invalid file entry" });
            continue;
        }

        const file = entry as File;
        const origName = file.name;

        if (!origName.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
            uploadedResults.push({ originalName: origName, success: false, message: "Not a PDF" });
            continue;
        }

        const candidate = origName;

        // storage path — include timestamp to avoid key collisions
        const storagePath = `uploads/${Date.now()}_${candidate}`;

        const { error: uploadErr } = await supabaseServer.storage
            .from(bucketName)
            .upload(storagePath, file, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadErr) {
            console.error("Supabase Upload Error:", uploadErr);
            uploadedResults.push({ originalName: origName, success: false, message: "Failed to upload to storage" });
            continue;
        }

        // insert record
        const { error: insertErr } = await supabaseServer
            .from("pdf_file")
            .insert([{ file: storagePath, email: cleanEmail, file_name: candidate }]);

        if (insertErr) {
            console.error("Supabase Insert Error:", insertErr);
            uploadedResults.push({ originalName: origName, success: false, message: "Failed to insert DB record" });
            continue;
        }

        // update daily upload counter
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
            const record_add = (record.uploaded_pdf ?? 0) + 1;
            await supabaseServer
                .from("system_logs")
                .update({ uploaded_pdf: record_add })
                .eq("request", cleanEmail);
        } else {
            await supabaseServer
                .from("system_logs")
                .insert([{
                    request: cleanEmail,
                    uploaded_pdf: 1,
                }]);
        }

        uploadedResults.push({ originalName: origName, storedName: candidate, success: true });
    }

    return NextResponse.json({ success: true, message: "Uploaded Successfully", uploaded: uploadedResults }, { status: 200 });

}