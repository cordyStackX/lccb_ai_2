import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(params: NextRequest) {
    
    const { name, instruction, body, email } = await params.json();

    if (!email) return NextResponse.json({ success: false, message: "User Not Found" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("chatbot_public")
    .select("email")
    .eq("email", email);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (data && data.length > 0) {

        const { error } = await supabaseServer
        .from("chatbot_public")
        .update([{ name, instruction, body }])
        .eq("email", email);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, message: "Update Successfully" }, { status: 200 });

    }

    const { error: insertErr } = await supabaseServer
    .from("chatbot_public")
    .insert([{ name, instruction, body, email }]);

    if (insertErr) {
        console.error("Supabase Query Error: ", insertErr);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }
    console.log("Update Chat Bot");
    return NextResponse.json({ success: true, message: "Update Successfully" }, { status: 200 });

}