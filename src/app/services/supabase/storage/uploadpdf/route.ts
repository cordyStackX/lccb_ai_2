import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    
    const form = await req.formData();
    const file = form.get("file") as File;
    const email = form.get("email") as string;
    const status = form.get("status") as string;

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
            
            const { data, error } = await supabaseServer
            .from("pdf_file")
            .insert([{ file: filePath, email: cleanEmail, file_name: filename, status: status }]);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

            console.log("Status: ", data);

            return NextResponse.json({ success: true, message: "File upload successfully" }, { status: 200 });

        }
    }

}