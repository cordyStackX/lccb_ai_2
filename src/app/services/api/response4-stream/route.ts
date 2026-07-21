import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, email, last_user_response, last_ai_response, f_name } = await req.json();

    const apikey = process.env.API_KEY;

    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    if (!email) {
        return NextResponse.json({ success: false, error: "Email not exist invalid user" }, { status: 404 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;

    if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });
    }

    const upstream = await fetch(`${apiUrl}generate-md-stream-sensitive-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            token: apikey,
            email: email,
            f_name: f_name,
            last_user_response: last_user_response,
            last_ai_response: last_ai_response,
            method: "text_sensitive"
        }),
    });

    if (!upstream.ok || !upstream.body) {
        const errorData = await upstream.json().catch(() => null);
        return NextResponse.json(
            { success: false, error: errorData?.error || "Upstream stream error" },
            { status: upstream.status || 500 }
        );
    }

    const { data: record, error: record_err } = await supabaseServer
        .from("system_logs")
        .select("api_request, created_at")
        .eq("request", email)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
        .maybeSingle();

    if (record_err) {
        console.error("Supabase Query Error: ", record_err);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (record) {
        const record_add = (record.api_request ?? 0) + 1;
        await supabaseServer
            .from("system_logs")
            .update({ api_request: record_add })
            .eq("request", email);
    }

    if (!record) {
        await supabaseServer
            .from("system_logs")
            .insert([
                {
                    request: email,
                    api_request: 1,
                },
            ]);
    }

    return new NextResponse(upstream.body, {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
    } catch (error) {
        console.error("response-stream POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
