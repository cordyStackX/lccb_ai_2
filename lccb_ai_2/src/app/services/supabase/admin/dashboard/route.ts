import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import apiLinks from "@/config/conf/json_config/Api_links.json";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    try {
        const response = await fetch(`${process.env.RENDER_API || apiLinks.python_links}dashboard-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: process.env.API_KEY }),
            cache: "no-store",
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.success) {
            return NextResponse.json({ success: false, error: body?.error || "Dashboard analysis is unavailable" }, { status: 502 });
        }
        return NextResponse.json(body, { status: 200 });
    } catch (error) {
        console.error("Dashboard analysis error:", error);
        return NextResponse.json({ success: false, error: "Dashboard analysis is unavailable" }, { status: 502 });
    }
}
