import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";


export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = await req.formData();
    const file = form.get("file") as File;
    const email = form.get("email") as string;

    const filename = file.name;

    const cleanEmail = email.trim().toLowerCase();

    if (!file) return NextResponse.json({ success: false, error: "PDF Not Detected" }, { status: 404 });

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const bucketName = "pdfs";
    const filePath = `uploads/${Date.now()}_${file.name}`;

    const { data, error } = await supabaseServer
    .from("pdf_file")
    .select("id")
    .eq("email", cleanEmail)
    .eq("file_name", filename);

    if (data && data.length > 0) return NextResponse.json({ success: false, error: "Pdf file Already exist" }, { status: 409 });

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (data) {

        const { data, error } = await supabaseServer.storage
        .from(bucketName)
        .upload(filePath, file, {
            contentType: "application/json"
        });

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        if (data) {
            
            const { error } = await supabaseServer
            .from("pdf_file")
            .insert([{ file: filePath, email: cleanEmail, file_name: filename }]);

            const { data: record, error: record_err } = await supabaseServer
            .from("system_logs")
            .select("uploaded_pdf, created_at")
            .eq("request", cleanEmail)
            .gte("created_at", new Date().toISOString().split("T")[0]) // today start
            .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0]) // tomorrow start
            .maybeSingle();

            if (error && record_err) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

            if (record) {
                const record_add = (record.uploaded_pdf ?? 0) + 1;
                await supabaseServer
                .from("system_logs")
                .update({ uploaded_pdf: record_add })
                .eq("request", cleanEmail);
            }

            if (!record) {
                await supabaseServer
                .from("system_logs")
                .insert([{
                    request: cleanEmail,
                    uploaded_pdf: 1,
                }]);
            }

            return NextResponse.json({ success: true, message: "File upload successfully" }, { status: 200 });

        }
    }

}