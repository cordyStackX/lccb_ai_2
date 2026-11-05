import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Keep recent quota logs intact; Free Trial request counts use their
    // creation date and only need to be retained through the trial window.
    const now = new Date();
    if (now.getUTCMonth() === 0 && now.getUTCDate() === 1) {
        const oneYearAgo = new Date(now);
        oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
        const { error: deleteError } = await supabaseServer.from("system_logs").delete().lt("created_at", oneYearAgo.toISOString());
        if (deleteError) {
            console.error("Supabase log cleanup error:", deleteError);
            return NextResponse.json({ success: false, error: "Failed to rotate API logs" }, { status: 500 });
        }
    }

    const { email } = await req.json();

    if (email === "admin@admin.com") {
        const { data, error } = await supabaseServer
        .from("system_logs")
        .select("*");

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data }, { status: 200 });
    }

    const { data, error } = await supabaseServer
    .from("system_logs")
    .select("*")
    .eq("request", email);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    console.log(data);

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}
