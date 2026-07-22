import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/lib/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    const { data, error } = await supabaseServer
    .from("setting")
    .select("*")
    .eq("email", email);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: data,
    }, { status: 200 });
}