import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { Fetch_to } from "@/utilities";

export async function POST(params: NextRequest) {
    
    const { prompt, email, pdf_id } = await params.json();

    const apikey = process.env.API_KEY;

    if (!email) return NextResponse.json({ success: false, error: "Email not exist invalid user" }, { status: 404 });

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    if (!pdf_id) return NextResponse.json({ success: false, error: "Please provide Your Documents before we procceed" }, { status: 401 });

    const apiUrl = process.env.RENDER_API || api_links.python_links;

    if (!prompt) return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 401 });

    const response = await Fetch_to(`${apiUrl}download-file`, { token: apikey, pdf_id: pdf_id });

    if (!response.success) return NextResponse.json({ success: false, error: "3rd party failed to read the data" }, { status: 409 });

    try {

        const response = await Fetch_to(`${apiUrl}generate-md`, { prompt: prompt, token: apikey, email: email, pdf_id: pdf_id });

        if (response.success) {
            return NextResponse.json({ success: true, message: response }, { status: 200 });
        } else {
            return NextResponse.json({ success: true, error: response.message }, { status: 409 });
        }

    } catch (err: unknown) {
        console.error("Back End Error: ", err);
    }

}