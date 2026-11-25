import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email, started_at, sensitive = false, include_completed = false } = await req.json().catch(() => ({}));
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    if (sensitive && auth.role?.toLowerCase() !== "admin") {
        return NextResponse.json({ success: false, error: "Only administrators can view sensitive processing status" }, { status: 403 });
    }
    const table = sensitive ? "chatbot_pdf_file_private" : "chatbot_pdf_file";
    let query = supabaseServer.from(table)
        .select("*")
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

    const recentTransitionCutoff = Date.now() - 30 * 60 * 1000;
    const progress = (data ?? []).flatMap((row) => {
        const status = row.processing_progress?.status;
        const updatedAt = Date.parse(row.processing_progress?.updated_at || row.created_at || "");
        if (status === "processing" && updatedAt >= recentTransitionCutoff) return [row];
        // Sensitive extraction finishes just before the upload route encrypts
        // and saves its matched records. Keep that handoff recoverable.
        if (sensitive && status === "complete" && row.processing_progress?.phase === "matching_student_records" && updatedAt >= Date.now() - 2 * 60 * 1000) {
            return [{
                ...row,
                processing_progress: {
                    ...row.processing_progress,
                    status: "processing",
                    phase: "saving_matched_records",
                    message: "Finishing the secure save of matched student records…",
                },
            }];
        }
        if (include_completed === true && status === "complete" && updatedAt >= recentTransitionCutoff) return [row];

        // Page extraction completes just before Q&A generation starts. During
        // that handoff, the upload route is still working although the progress
        // JSON briefly says "complete" and the final summary has not been saved.
        if (status === "complete" && !sensitive && !row.summary && updatedAt >= recentTransitionCutoff) {
            return [{
                ...row,
                processing_progress: {
                    ...row.processing_progress,
                    status: "processing",
                    phase: "generating_qa",
                    message: "Preparing questions and answers for your PDF…",
                },
            }];
        }
        return [];
    });

    return NextResponse.json({ success: true, progress });
}
