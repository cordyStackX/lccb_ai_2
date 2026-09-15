import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { rateLimit } from "@/firewall/rate_limit";
import { encryptText } from "@/firewall/encryptions";
import nodemailer from "nodemailer";

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

  const { email, account_number, method, plan_type  } = await params.json();

  if (!email || !account_number || !method || !plan_type) return NextResponse.json({ success: false, error: "Missing Credentials" }, { status: 404 });

  if (!["Pro", "Enterprise"].includes(plan_type)) {
    return NextResponse.json({ success: false, error: "Invalid plan type" }, { status: 400 });
  }

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
      account_number: encryptText(account_number, process.env.API_KEY || ""),
      method: method,
      amount: amount,
      vat: vat,
      status: status,
      plan_type: plan_type
    }]);

      if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
      }

      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.GMAIL_USERNAME,
              pass: process.env.GMAIL_APP_PASSWORD
          }
      });
  
      const mailOption = {
          from: process.env.GMAIL_USERNAME,
          to: email,
          subject: `LACO AI — Payment Submitted, Pending Review`,
          html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
              <tr>
                  <td align="center">
                      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                          <tr>
                              <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:36px 24px; text-align:center;">
                                  <div style="font-size:40px; line-height:1; margin-bottom:8px;">⏳</div>
                                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Payment Received</h1>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding:32px 32px 8px 32px; text-align:center;">
                                  <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">We've received your payment request for</p>
                                  <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                      ${email}
                                  </p>
                                  <p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                      Your <strong>${plan_type}</strong> plan payment is currently <strong>pending</strong> and under review by our admin team.
                                  </p>
                                  <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                      We'll notify you by email as soon as it's verified and your plan is activated.
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding:0 32px 36px 32px; text-align:center;">
                                  <a href="${process.env.APP_URL}" style="display:inline-block; background-color:#213b94; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:12px 28px; border-radius:8px;">
                                      Check Status
                                  </a>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding:20px 32px; background-color:#f4f4f5; text-align:center;">
                                  <p style="margin:0; font-size:12px; color:#808080;">
                                      LACO AI &middot; This is an automated message, please do not reply.
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
          `
      };

      await transporter.sendMail(mailOption);

      return NextResponse.json({ success: true, message: "Submit Payment Successfully" }, { status: 200 });

  } catch (err) {
    console.error("BackEnd Error: ", err);
    return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
  }

}