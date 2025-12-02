import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Fetch_to } from "@/utilities";

export async function POST(params: NextRequest) {
    
    const { prompt } = await params.json();

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    const apiUrl = api_links.python_links || api_links.render_links;

    if (!prompt) return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });

    try {

        const response = await Fetch_to(apiUrl, { prompt: prompt, token: apikey });

        if (response.success) {
            return NextResponse.json({ success: true, message: response }, { status: 200 });
        } else {
            return NextResponse.json({ success: true, error: "Unreachable Endpoints" }, { status: 409 });
        }

    } catch (err: unknown) {
        console.error("Back End Error: ", err);
    }

    

}