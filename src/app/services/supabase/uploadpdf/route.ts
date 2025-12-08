import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    
    const form = await req.formData();
    const file = form.get("file") as File;
    const email = form.get("email") as string;

    const cleanEmail = email.trim().toLowerCase();

    if (!file) return NextResponse.json({ success: false, error: "PDF Not Detected" }, { status: 404 });

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const bucketName = "pdfs";
    const filePath = `uploads/${Date.now()}_${file.name}`;

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

        const { data: publicUrlData } = supabaseServer.storage.from(bucketName).getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;
        
        const { data, error } = await supabaseServer
        .from("pdf_file")
        .insert([{ file: publicUrl, email:  cleanEmail }]);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        console.log("Status: ", data);

        return NextResponse.json({ success: true, message: "File upload successfully" }, { status: 200 });

    }



}