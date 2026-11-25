import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { acquireChatStream, releaseChatStream, releaseWhenStreamEnds } from "@/lib/chat-stream-lock";

export async function POST(req: NextRequest) {
    let streamLockEmail = "";
    try {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (auth.role?.toLowerCase() !== "student") {
        return NextResponse.json({ success: false, error: "Sensitive academic chat is available only to students" }, { status: 403 });
    }

    const { prompt, email, history } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const apikey = process.env.API_KEY;

    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    if (!cleanEmail || auth.email?.trim().toLowerCase() !== cleanEmail) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { data: profile, error: profileError } = await supabaseServer.from("auth").select("f_name")
        .eq("email", cleanEmail).maybeSingle();
    if (profileError || !profile) return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });

    const apiUrl = process.env.RENDER_API || api_links.python_links;

    if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });
    }

    if (!acquireChatStream(cleanEmail)) {
        return NextResponse.json({ success: false, error: "Wait for the current AI response to finish." }, { status: 429 });
    }
    streamLockEmail = cleanEmail;

    const upstream = await fetch(`${apiUrl}generate-md-stream-sensitive-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            token: apikey,
            email: cleanEmail,
            f_name: profile.f_name,
            history: history,
            method: "text_sensitive"
        }),
    });

    if (!upstream.ok || !upstream.body) {
        releaseChatStream(streamLockEmail);
        streamLockEmail = "";
        const errorData = await upstream.json().catch(() => null);
        return NextResponse.json(
            { success: false, error: errorData?.error || "Upstream stream error" },
            { status: upstream.status || 500 }
        );
    }

    const { data: record, error: record_err } = await supabaseServer
        .from("system_logs")
        .select("api_request, created_at")
        .eq("request", cleanEmail)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
        .maybeSingle();

    if (record_err) {
        releaseChatStream(streamLockEmail);
        streamLockEmail = "";
        console.error("Supabase Query Error: ", record_err);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (record) {
        const record_add = (record.api_request ?? 0) + 1;
        await supabaseServer
            .from("system_logs")
            .update({ api_request: record_add })
            .eq("request", cleanEmail);
    }

    if (!record) {
        await supabaseServer
            .from("system_logs")
            .insert([
                {
                    request: cleanEmail,
                    api_request: 1,
                },
            ]);
    }

    streamLockEmail = "";
    return new NextResponse(releaseWhenStreamEnds(upstream.body, cleanEmail), {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
    } catch (error) {
        if (streamLockEmail) releaseChatStream(streamLockEmail);
        console.error("response-stream POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
