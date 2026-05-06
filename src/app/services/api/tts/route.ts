import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Security } from "@/lib/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: stateRows, error: stateError } = await supabaseServer
        .from("setting")
        .select("state")
        .eq("target", "suspend");

    if (stateError) {
        console.error("Supabase Query Error: ", stateError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    // Check if voice API is suspended
    const suspendedState = Array.isArray(stateRows) && stateRows.length > 0 ? stateRows[0]?.state : null;
    if (suspendedState === "suspend") {
        return NextResponse.json(
            { success: false, error: "🤖 Voice API is temporarily suspended for maintenance ⚠️" },
            { status: 503 }
        );
    }

    const apikey = process.env.API_KEY;
    if (!apikey) {
        return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    }

    const apiUrl = process.env.RENDER_API || api_links.python_links;
    const { text, voice } = await req.json();

    if (!text) {
        return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const upstream = await fetch(`${apiUrl}generate-tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token: apikey,
            text: text,
            voice: voice,
        }),
    });

    if (!upstream.ok) {
        const errorData = await upstream.json().catch(() => null);
        return NextResponse.json(
            { success: false, error: errorData?.error || "Upstream TTS error" },
            { status: upstream.status || 500 }
        );
    }

    const audioBuffer = await upstream.arrayBuffer();

    return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
        },
    });
}
