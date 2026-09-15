import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

const VALID_STATUSES = ["success", "declined", "refunded"] as const;
type PaymentEmailStatus = (typeof VALID_STATUSES)[number];

const STATUS_CONTENT: Record<PaymentEmailStatus, { icon: string; heading: string; subject: string; body: string }> = {
  success: {
    icon: "✅",
    heading: "Payment Approved",
    subject: "LACO AI — Payment Approved",
    body: "Your payment has been verified and your plan is now active.",
  },
  declined: {
    icon: "❌",
    heading: "Payment Declined",
    subject: "LACO AI — Payment Declined",
    body: "Unfortunately, your payment could not be verified.",
  },
  refunded: {
    icon: "💸",
    heading: "Payment Refunded",
    subject: "LACO AI — Payment Refunded",
    body: "Your refund has been processed.",
  },
};

async function sendPaymentStatusEmail(email: string, status: PaymentEmailStatus, reason?: string | null) {
  const content = STATUS_CONTENT[status];

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const reasonBlock = reason
    ? `<p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
         <strong>Reason:</strong> ${reason}
       </p>`
    : "";

  const mailOption = {
    from: process.env.GMAIL_USERNAME,
    to: email,
    subject: content.subject,
    html: `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:36px 24px; text-align:center;">
                            <div style="font-size:40px; line-height:1; margin-bottom:8px;">${content.icon}</div>
                            <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">${content.heading}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 32px 8px 32px; text-align:center;">
                            <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">This update is for</p>
                            <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                ${email}
                            </p>
                            <p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                ${content.body}
                            </p>
                            ${reasonBlock}
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
    `,
  };

  await transporter.sendMail(mailOption);
}

export async function POST(params: NextRequest) {

  const auth = await Security(params);
  if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { email, status, reason } = await params.json();

  if (!email) return NextResponse.json({ success: false, error: "Email not Exist" }, { status: 404 });

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  try {

    const { error } = await supabaseServer
    .from("payments")
    .update({ status: status, reason: reason ?? null })
    .eq("email", email);

    if (error) {
      console.error("Supabase Query Error: ", error);
      return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    try {
      await sendPaymentStatusEmail(email, status, reason);
    } catch (mailErr) {
      console.error("Payment status email error:", mailErr);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("BackEnd Error: ", err);
    return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
  }

}