import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    try {
        const { email, status, reason } = await req.json();

        if (!email || !status) {
            return NextResponse.json({ success: false, error: "Missing email or status" }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        if (status === "active") {
            const { error } = await supabaseServer
                .from("auth")
                .update({ status: "active" })
                .eq("email", email);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

            const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: email,
            subject: `Your LACO AI Account Is Now Active`,
            html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:36px 24px; text-align:center;">
                                    <div style="font-size:40px; line-height:1; margin-bottom:8px;">✅</div>
                                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Account Active</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px 32px 8px 32px; text-align:center;">
                                    <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">Your account is now active for</p>
                                    <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                        ${email}
                                    </p>
                                    <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                        You can now log in and upload PDF documents to ask LACO AI questions and get instant explanations, insights, and your latest grades.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 32px 36px 32px; text-align:center;">
                                    <a href="${process.env.APP_URL}" style="display:inline-block; background-color:#213b94; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:12px 28px; border-radius:8px;">
                                        Go to LACO AI
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

            try {
                await transporter.sendMail(mailOption);
            } catch (mailErr) {
                console.error("Mail Error (accept):", mailErr);
                // don't fail the whole request just because email didn't send
            }

            return NextResponse.json({ success: true, message: "User Status Updated Successfully" }, { status: 200 });
        }

        if (status === "decline") {
            const reasonText = String(reason || "").trim();

            const mailOption = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: `LACO AI Account Request Declined`,
                html: `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                                <tr>
                                    <td style="background:linear-gradient(135deg, #c0392b, #e07a5f); padding:36px 24px; text-align:center;">
                                        <div style="font-size:40px; line-height:1; margin-bottom:8px;">⚠️</div>
                                        <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Request Declined</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:32px 32px 8px 32px; text-align:center;">
                                        <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">Your account request for</p>
                                        <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                            ${email}
                                        </p>
                                        <p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                            was <strong>declined</strong> during review.
                                        </p>
                                        ${
                                            reasonText
                                                ? `<p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c; text-align:left; background-color:#fdf2f0; padding:12px 16px; border-radius:8px;">
                                                    <strong>Reason:</strong> ${reasonText}
                                                   </p>`
                                                : ""
                                        }
                                        <p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                            If you believe this was a mistake, please re-register your account with corrected information.
                                        </p>
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

            try {
                await transporter.sendMail(mailOption);
            } catch (mailErr) {
                console.error("Mail Error (decline):", mailErr);
            }

            const { error } = await supabaseServer
                .from("auth")
                .delete()
                .eq("email", email);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: "User Status Declined Successfully" }, { status: 200 });
        }

        if (status === "suspend") {
            const { error } = await supabaseServer
                .from("auth")
                .update({ status: "suspend" })
                .eq("email", email);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

            const mailOption = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: `Your LACO AI Account Has Been Suspended`,
                html: `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                                <tr>
                                    <td style="background:linear-gradient(135deg, #b8860b, #e0a72f); padding:36px 24px; text-align:center;">
                                        <div style="font-size:40px; line-height:1; margin-bottom:8px;">⏸️</div>
                                        <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Account Suspended</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:32px 32px 8px 32px; text-align:center;">
                                        <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">Your account has been suspended for</p>
                                        <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                            ${email}
                                        </p>
                                        <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                            You will not be able to access LACO AI while your account is suspended. If you believe this was a mistake, please contact the administrator.
                                        </p>
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

            try {
                await transporter.sendMail(mailOption);
            } catch (mailErr) {
                console.error("Mail Error (suspend):", mailErr);
            }

            return NextResponse.json({ success: true, message: "User Suspended Successfully" }, { status: 200 });
        }
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });

    } catch (err) {
        console.error("BackEnd Error: ", err);
        return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
    }
}