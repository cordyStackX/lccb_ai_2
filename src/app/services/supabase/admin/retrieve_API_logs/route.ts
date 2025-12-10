import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    
    const { data, error } = await supabaseServer
    .from("API_logs")
    .select("*");

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}