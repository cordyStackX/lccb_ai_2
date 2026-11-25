import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Fetch_to } from "@/utilities";
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

    const { prompt, email, pdf_id, history, last_user_response, last_ai_response, f_name } = await req.json();

    const apikey = process.env.API_KEY;

    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    if (!email) {
        return NextResponse.json({ success: false, error: "Email not exist invalid user" }, { status: 404 });
    }

    if (!pdf_id) {
        return NextResponse.json({ success: false, error: "Please provide Your Documents before we procceed" }, { status: 401 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;

    if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!acquireChatStream(cleanEmail)) {
        return NextResponse.json({ success: false, error: "Wait for the current AI response to finish." }, { status: 429 });
    }
    streamLockEmail = cleanEmail;

    const download = await Fetch_to(`${apiUrl}download-file`, { token: apikey, pdf_id: pdf_id });

    if (!download.success) {
        releaseChatStream(streamLockEmail);
        streamLockEmail = "";
        return NextResponse.json({ success: false, error: "3rd party failed to read the data" }, { status: 409 });
    }

    const upstream = await fetch(`${apiUrl}generate-md-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            token: apikey,
            email: email,
            f_name: f_name,
            pdf_id: pdf_id,
            history: history,
            last_user_response: last_user_response,
            last_ai_response: last_ai_response,
            method: "text"
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
        .select("id, api_request, created_at")
        .eq("request", email)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1)
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
            .eq("id", record.id);
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
