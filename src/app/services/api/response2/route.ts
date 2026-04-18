import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Fetch_to } from "@/utilities";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    
    const { prompt, last_user_response, last_ai_response } = await req.json();

    const apikey = process.env.API_KEY;

    const email = "admin@admin.com";

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    const apiUrl = process.env.RENDER_API || api_links.python_links;

    const { data } = await supabaseServer
    .from("pdf_file")
    .select("id, status")
    .eq("email", email);

    const speakPdf = data?.find((pdf) => pdf.status === "Speak");
    
    if(!speakPdf) return NextResponse.json({ success: false, error: "The Admin didn't Setup it" }, { status: 409 });

    if (!prompt) return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });

    const response = await Fetch_to(`${apiUrl}download-file`, { token: apikey, pdf_id: speakPdf?.id });

    if (!response.success) return NextResponse.json({ success: false, error: "3rd party failed to read the data" }, { status: 409 });

    try {

        const response = await Fetch_to(`${apiUrl}generate-md`, {
            prompt: prompt,
            token: apikey,
            email: email,
            pdf_id: speakPdf?.id,
            last_user_response: last_user_response,
            last_ai_response: last_ai_response,
        });

        const { data: record, error: record_err } = await supabaseServer
            .from("system_logs")
            .select("api_request, created_at")
            .eq("request", email)
            .gte("created_at", new Date().toISOString().split("T")[0]) // today start
            .lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0]) // tomorrow start
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
            .insert([{
                request: email,
                api_request: 1,
            }]);
        }

        if (response.success) {
            return NextResponse.json({ success: true, message: response }, { status: 200 });
        } else {
            return NextResponse.json({ success: true, error: response.message }, { status: 409 });
        }

    } catch (err: unknown) {
        console.error("Back End Error: ", err);
    }

}