import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(params: NextRequest) {
    
    const auth = await Security(params);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { email, limit = 5, offset = 0 } = await params.json();

    if (!email) {
        return NextResponse.json({ success: false, error: "Invalid" }, { status: 404 });
    }

    const { data, error } = await supabaseServer
    .from("chat_history")
    .select("id, history, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    const { count } = await supabaseServer
        .from("chat_history")
        .select("id", { count: "exact", head: true })
        .eq("email", email);

    return NextResponse.json({
        success: true,
        data,
        hasMore: typeof count === "number" ? offset + limit < count : false,
    }, { status: 200 });

}
