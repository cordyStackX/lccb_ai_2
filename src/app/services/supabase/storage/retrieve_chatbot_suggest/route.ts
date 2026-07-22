import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(params: NextRequest) {
    
    const { email } = await params.json();

    if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("chatbot_pdf_file")
    .select("suggest")
    .eq("email", email);

    if (error) {
        console.error("Supabase Query Error:", error);
        return NextResponse.json(
        { success: false, error: "Something went wrong" },
        { status: 500 }
        );
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}