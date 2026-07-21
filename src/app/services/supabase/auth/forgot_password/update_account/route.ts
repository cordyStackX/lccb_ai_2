import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "update_account" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    try {

        const { email, password, c_password } = await req.json();

        if (!email || !password || !c_password) return NextResponse.json({ success: false, error: "You Rejected Invalid Info" }, { status: 404 });

        if (password !== c_password) return NextResponse.json({ success: false, error: "Password is not match" }, { status: 409 });

        if (password.length < 8) return NextResponse.json({ success: false, error: "Must be more than 8 characters" }, { status: 409 });

        const cleanEmail = email.trim().toLowerCase();

        const resolveEmail = (email: string) => {
            if (email === process.env.ADMIN_ALIAS) {
                console.log("Admin Loggin as ", process.env.GMAIL_USERNAME);
                return process.env.GMAIL_USERNAME;
            }
            return email;
        };

        const hashed = await bcrypt.hash(password, 10);

        const { data, error } = await supabaseServer
        .from("auth")
        .update({ password: hashed })
        .eq("email", cleanEmail);

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

        const targetEmail = resolveEmail(cleanEmail);

        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: targetEmail,
            subject: "Your LACO AI Password Was Changed",
            html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:28px 24px; text-align:center;">
                                    <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">Password Changed</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px 32px 8px 32px; text-align:center;">
                                    <p style="margin:0 0 4px 0; font-size:15px; color:#3c3c3c;">Hello,</p>
                                    <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#3c3c3c;">
                                        The password for your LACO AI account <strong>${cleanEmail}</strong> was successfully changed.
                                    </p>
                                    <p style="margin:0 0 28px 0; font-size:13px; line-height:1.6; color:#808080;">
                                        If you didn't make this change, please contact the admin immediately to secure your account.
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
            `
        };

        await transporter.sendMail(mailOption);

        console.log(" ==> User Successfully Update an Account ", data);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}