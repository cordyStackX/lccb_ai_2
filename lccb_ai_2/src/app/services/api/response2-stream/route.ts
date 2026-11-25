import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { supabaseServer } from "@/lib/supabase-server";
import { isBusinessPlanExpired } from "@/lib/business_plan_usage";
import { acquireChatStream, releaseChatStream, releaseWhenStreamEnds } from "@/lib/chat-stream-lock";

export async function POST(req: NextRequest) {
    let streamLockEmail = "";
    try {

    const { prompt, history, last_user_response, last_ai_response, email } = await req.json();

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
        .from("auth_business")
        .select("current_plan, current_limit, created_at, plan_expires_at")
        .eq("email", cleanEmail)
        .maybeSingle();

    if (planError || !planRow) {
        console.error("Supabase Query Error: ", planError);
        return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });
    }

    const { current_plan, current_limit, created_at } = planRow;

    if (isBusinessPlanExpired(current_plan, created_at, planRow.plan_expires_at)) {
        return NextResponse.json({ success: false, error: "Your plan has expired. Please renew or upgrade to continue." }, { status: 403 });
    }

    if (current_plan === "Free Trial" && current_limit !== null) {
        const trialExpiry = new Date(created_at);
        trialExpiry.setMonth(trialExpiry.getMonth() + 1);
        if (new Date() >= trialExpiry) return NextResponse.json({ success: false, error: "Your free trial has ended. Please upgrade your plan." }, { status: 403 });
        const usagePeriodStart = new Date(created_at).toISOString();

        const { data: logRows, error: logError } = await supabaseServer
            .from("system_logs")
            .select("api_request")
            .eq("request", cleanEmail)
            .gte("created_at", usagePeriodStart);

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

    } 

    const apikey = process.env.API_KEY;
    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;
    if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });
    }

    if (!acquireChatStream(cleanEmail)) {
        return NextResponse.json({ success: false, error: "Wait for the current AI response to finish." }, { status: 429 });
    }
    streamLockEmail = cleanEmail;

    const upstream = await fetch(`${apiUrl}generate-md-chatbot-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            token: apikey,
            email: email,
            history: history,
            last_user_response: last_user_response,
            last_ai_response: last_ai_response,
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
        .eq("request", email)
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
        console.error("response2-stream POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
