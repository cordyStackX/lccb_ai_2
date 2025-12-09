import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    
    const { email } = await req.json();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("pdf_file")
    .select("id, file, file_name, status")
    .eq("email", cleanEmail);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (data.length <= 0) return NextResponse.json({ success: true, error: [{ id: 0, file_name: "No PDF Found" }] }, { status: 400 });

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}