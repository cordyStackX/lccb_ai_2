import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";
import { getUsedPdfPages, isBusinessPlanExpired, planPageLimit } from "@/lib/business_plan_usage";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email } = await req.json().catch(() => ({}));
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    if (auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { data: plan, error } = await supabaseServer.from("auth_business")
        .select("current_plan, created_at, plan_expires_at").eq("email", cleanEmail).maybeSingle();
    if (error || !plan) return NextResponse.json({ success: false, error: "Failed to fetch account plan" }, { status: 500 });

    const expired = isBusinessPlanExpired(plan.current_plan, plan.created_at, plan.plan_expires_at);
    try {
        const used = await getUsedPdfPages(cleanEmail);
        return NextResponse.json({ success: true, used, limit: planPageLimit(plan.current_plan), expired });
    } catch (usageError) {
        console.error("PDF page usage query failed:", usageError);
        return NextResponse.json({ success: false, error: "Failed to calculate PDF page usage" }, { status: 500 });
    }
}
