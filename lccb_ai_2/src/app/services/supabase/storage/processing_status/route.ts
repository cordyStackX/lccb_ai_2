import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email, started_at, sensitive = false } = await req.json().catch(() => ({}));
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    if (sensitive && auth.role?.toLowerCase() !== "admin") {
        return NextResponse.json({ success: false, error: "Only administrators can view sensitive processing status" }, { status: 403 });
    }
    const table = sensitive ? "chatbot_pdf_file_private" : "chatbot_pdf_file";
    let query = supabaseServer.from(table)
        .select("file_name, processing_progress, created_at")
        .eq("email", cleanEmail)
        .not("processing_progress", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
    if (typeof started_at === "string" && !Number.isNaN(Date.parse(started_at))) {
        query = query.gte("created_at", new Date(started_at).toISOString());
    }

    const { data, error } = await query;
    if (error) {
        console.error("Document processing status lookup failed:", error);
        return NextResponse.json({ success: false, error: "Failed to retrieve document progress" }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: data ?? [] });
}
