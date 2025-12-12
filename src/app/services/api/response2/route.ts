import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Fetch_to } from "@/utilities";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
     if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const { prompt } = await req.json();

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

        const response = await Fetch_to(`${apiUrl}generate-md`, { prompt: prompt, token: apikey, email: email, pdf_id: speakPdf?.id });

        await supabaseServer
        .from("API_logs")
        .insert({ request: email });

        if (response.success) {
            return NextResponse.json({ success: true, message: response }, { status: 200 });
        } else {
            return NextResponse.json({ success: true, error: response.message }, { status: 409 });
        }

    } catch (err: unknown) {
        console.error("Back End Error: ", err);
    }

}