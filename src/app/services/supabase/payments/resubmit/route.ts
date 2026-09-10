import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";
import { maskAccountNumber } from "@/lib/payment-account";

export async function POST(request: NextRequest) {
    const auth = await Security(request);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, account_number, method, email } = await request.json();

    if (!paymentId || !account_number || !method || !email) {
        return NextResponse.json({ success: false, error: "Payment details are required." }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseServer
            .from("payments")
            .update({ account_number: maskAccountNumber(account_number), method, reason: null, status: "pending" })
            .eq("id", paymentId)
            .eq("email", email)
            .neq("status", "refund_requested")
            .select("id, account_number, method, reason, status")
            .maybeSingle();

        if (error) {
            console.error("Payment resubmission error:", error);
            return NextResponse.json({ success: false, error: "Unable to resubmit payment details." }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: "This payment cannot be resubmitted." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Payment details resubmitted.", payment: data });
    } catch (error) {
        console.error("Payment resubmission error:", error);
        return NextResponse.json({ success: false, error: "Unable to resubmit payment details." }, { status: 500 });
    }
}
