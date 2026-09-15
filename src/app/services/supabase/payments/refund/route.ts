import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

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
            .update({ status: "refund_requested", account_number: account_number, method })
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

        try {
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
                subject: `LACO AI — Refund Requested, Pending Review`,
                html: `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                                <tr>
                                    <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:36px 24px; text-align:center;">
                                        <div style="font-size:40px; line-height:1; margin-bottom:8px;">⏳</div>
                                        <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Refund Requested</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:32px 32px 8px 32px; text-align:center;">
                                        <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">We've received a refund request for</p>
                                        <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                            ${email}
                                        </p>
                                        <p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                            Your refund request is currently <strong>pending</strong> and under review by our admin team.
                                        </p>
                                        <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                            We'll notify you by email once it's been processed.
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
        } catch (mailErr) {
            console.error("Refund request email error:", mailErr);
            // Don't fail the request over a mail issue — the refund status update already succeeded.
        }

        return NextResponse.json({ success: true, message: "Refund request submitted.", payment: data });
    } catch (error) {
        console.error("Refund request error:", error);
        return NextResponse.json({ success: false, error: "Unable to request a refund." }, { status: 500 });
    }
}