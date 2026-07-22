import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {

    const { prompt, last_user_response, last_ai_response, email } = await req.json();

    const { data: stateRows, error: stateError } = await supabaseServer
        .from("setting")
        .select("state")
        .eq("email", email);

    if (stateError) {
        console.error("Supabase Query Error: ", stateError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    // Check if API is suspended
    const suspendedState = Array.isArray(stateRows) && stateRows.length > 0 ? stateRows[0]?.state : null;
    if (suspendedState === "suspend") {
        return NextResponse.json(
            { success: false, error: "🤖 Chatbot API is temporarily suspended for maintenance ⚠️" },
            { status: 503 }
        );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const { data: planRow, error: planError } = await supabaseServer
        .from("auth")
        .select("current_plan, current_limit")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (planError || !planRow) {
        console.error("Supabase Query Error: ", planError);
        return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
    }

    const { current_plan, current_limit } = planRow;

    if (current_plan === "Free Tier") {

        const { data: logRows, error: logError } = await supabaseServer
            .from("system_logs")
            .select("api_request")
            .eq("request", cleanEmail);

        if (logError) {
            console.error("Supabase Query Error: ", logError);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const totalApiRequest = (logRows ?? []).reduce((sum, row) => sum + (row.api_request ?? 0), 0);

        if (totalApiRequest >= Number(current_limit)) {
            return NextResponse.json(
                { success: false, error: "Current plan already reach limit, upgrade plan now" },
                { status: 403 }
            );
        }

    } else if (current_plan === "Pro") {
        // Pro tier — no limit enforcement for now
    }

    const apikey = process.env.API_KEY;
    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;
    if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });
    }

    const upstream = await fetch(`${apiUrl}generate-md-chatbot-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            token: apikey,
            email: email,
            last_user_response: last_user_response,
            last_ai_response: last_ai_response,
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
        console.error("response2-stream POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
