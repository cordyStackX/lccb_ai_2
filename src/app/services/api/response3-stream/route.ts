import { NextResponse } from "next/server";
// import { Fetch_to } from "@/utilities";
// import api_links from "@/config/conf/json_config/Api_links.json";
// import { supabaseServer } from "@/lib/supabase-server";
// import { Security } from "@/lib/security";

export async function POST() {

    return NextResponse.json({ success: false, message: "Voice is Unavailable" }, { status: 500 });

    // try {
    // const auth = await Security(req);
    // if (auth?.error) {
    //     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    // const { data: stateRows, error: stateError } = await supabaseServer
    //     .from("setting")
    //     .select("state")
    //     .eq("target", "suspend");

    // if (stateError) {
    //     console.error("Supabase Query Error: ", stateError);
    //     return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    // }

    // // Check if voice API is suspended
    // const suspendedState = Array.isArray(stateRows) && stateRows.length > 0 ? stateRows[0]?.state : null;
    // if (suspendedState === "suspend") {
    //     return NextResponse.json(
    //         { success: false, error: "🤖 Voice API is temporarily suspended for maintenance ⚠️" },
    //         { status: 503 }
    //     );
    // }

    // const apikey = process.env.API_KEY;
    // if (!apikey) {
    //     return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    // }

    // const apiUrl = process.env.RENDER_API || api_links.python_links;

    // const form = await req.formData();
    // const audio = form.get("audio");
    // const language = form.get("language");
    // const email = form.get("email");
    // const pdfId = form.get("pdf_id");
    // const fName = form.get("f_name");
    // const lastUserResponse = form.get("last_user_response");
    // const lastAiResponse = form.get("last_ai_response");

    // const download = await Fetch_to(`${apiUrl}download-file`, { token: apikey, pdf_id: pdfId });
    
    // if (!download.success) {
    //     return NextResponse.json({ success: false, error: "3rd party failed to read the data" }, { status: 409 });
    // }

    // if (!audio || !(audio instanceof File)) {
    //     return NextResponse.json({ success: false, error: "Audio file is required" }, { status: 400 });
    // }

    // const upstreamForm = new FormData();
    // upstreamForm.append("audio", audio);
    // upstreamForm.append("token", apikey);
    // if (typeof language === "string" && language) {
    //     upstreamForm.append("language", language);
    // }
    // if (typeof email === "string" && email) {
    //     upstreamForm.append("email", email);
    // }
    // if (typeof pdfId === "string" && pdfId) {
    //     upstreamForm.append("pdf_id", pdfId);
    // }
    // if (typeof fName === "string" && fName) {
    //     upstreamForm.append("f_name", fName);
    // }
    // if (typeof lastUserResponse === "string" && lastUserResponse) {
    //     upstreamForm.append("last_user_response", lastUserResponse);
    // }
    // if (typeof lastAiResponse === "string" && lastAiResponse) {
    //     upstreamForm.append("last_ai_response", lastAiResponse);
    // }
    

    // const upstream = await fetch(`${apiUrl}generate-voice-md-stream-pdf`, {
    //     method: "POST",
    //     body: upstreamForm,
    // });

    // if (!upstream.ok || !upstream.body) {
    //     const errorData = await upstream.json().catch(() => null);
    //     return NextResponse.json(
    //         { success: false, error: errorData?.error || "Upstream stream error" },
    //         { status: upstream.status || 500 }
    //     );
    // }

    // const emailFallback = "admin@admin.com";
    // const requestEmail = typeof email === "string" && email ? email : emailFallback;
    // const { data: record, error: record_err } = await supabaseServer
    //     .from("system_logs")
    //     .select("api_request, created_at")
    //     .eq("request", requestEmail)
    //     .gte("created_at", new Date().toISOString().split("T")[0])
    //     .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
    //     .maybeSingle();

    // if (record_err) {
    //     console.error("Supabase Query Error: ", record_err);
    //     return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    // }

    // if (record) {
    //     const record_add = (record.api_request ?? 0) + 1;
    //     await supabaseServer
    //         .from("system_logs")
    //         .update({ api_request: record_add })
    //         .eq("request", requestEmail);
    // }

    // if (!record) {
    //     await supabaseServer
    //         .from("system_logs")
    //         .insert([
    //             {
    //                 request: requestEmail,
    //                 api_request: 1,
    //             },
    //         ]);
    // }

    // return new NextResponse(upstream.body, {
    //     status: 200,
    //     headers: {
    //         "Content-Type": "text/event-stream; charset=utf-8",
    //         "Cache-Control": "no-cache",
    //         Connection: "keep-alive",
    //     },
    // });
    // } catch (error) {
    //     console.error("response3-stream POST Error:", error);
    //     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    // }
}
