import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { rateLimit } from "@/firewall/rate_limit";
import { maskAccountNumber } from "@/lib/payment-account";

export async function POST(params: NextRequest) {
  
  const auth = await Security(params);
  if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const rate = rateLimit(params, { windowMs: 60_000, max: 3, keyPrefix: "payments" });
  if (!rate.allowed) {
      const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
      return NextResponse.json(
          { success: false, error: "Too many requests. Please try again later." },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
  }

  const { email, account_number, method  } = await params.json();

  if (!email || !account_number || !method) return NextResponse.json({ success: false, error: "Missing Credentials" }, { status: 404 });

  const amount = 799;
  const vat = 85.61;
  const status = "pending";

  try { 
    const { data: pendingPayment, error: pendingPaymentError } = await supabaseServer
    .from("payments")
    .select("id")
    .eq("email", email)
    .eq("status", status)
    .limit(1)
    .maybeSingle();

    if (pendingPaymentError) {
      console.error("Supabase Query Error: ", pendingPaymentError);
      return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (pendingPayment) {
      return NextResponse.json({ success: false, error: "You still have existing pending payment" }, { status: 409 });
    }

    const { error } = await supabaseServer
    .from("payments")
    .insert([{
      email: email,
      account_number: maskAccountNumber(account_number),
      method: method,
      amount: amount,
      vat: vat,
      status: status
    }]);

      if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Submit Payment Successfully" }, { status: 200 });

  } catch (err) {
    console.error("BackEnd Error: ", err);
    return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
  }

}
