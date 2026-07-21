import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(params: NextRequest) {
    
    const auth = await Security(params);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, email, messages } = await params.json();

    if (!email) {
        return NextResponse.json({ success: false, error: "Invalid" }, { status: 404 });
    }

    if (!messages || messages.length < 0) {
        return NextResponse.json({ success: false, error: "Invalid" }, { status: 402 });
    }
    console.log("files ID", id);

    if (!id) {
         const { data, error } = await supabaseServer
        .from("chat_history")
        .insert([{ email: email, history: messages }])
        .select()
        .single();


        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }
        return NextResponse.json({ success: true, messages: data }, { status: 200 });
    }

    const { data, error } = await supabaseServer
    .from("chat_history")
    .update({ history: messages })
    .eq("id", id)
    .select();

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }
    console.log("Update Current Reponses of ID: ", id);
    return NextResponse.json({ success: true, messages: data }, { status: 200 });

}