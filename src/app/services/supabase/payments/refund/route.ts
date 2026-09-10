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
            .update({ status: "refund_requested", account_number: maskAccountNumber(account_number), method })
            .eq("id", paymentId)
            .eq("email", email)
            .neq("status", "refund_requested")
            .select("id, status")
            .maybeSingle();

        if (error) {
            console.error("Refund request error:", error);
            return NextResponse.json({ success: false, error: "Unable to request a refund." }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: "This refund has already been requested or the payment was not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Refund request submitted.", payment: data });
    } catch (error) {
        console.error("Refund request error:", error);
        return NextResponse.json({ success: false, error: "Unable to request a refund." }, { status: 500 });
    }
}
