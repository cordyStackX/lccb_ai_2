import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "create_account" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    try {

        const { email, password, c_password, name, year, role } = await req.json();

        if (!email || !password || !c_password) return NextResponse.json({ success: false, error: "You Rejected Invalid Info" }, { status: 404 });

        if (password !== c_password) return NextResponse.json({ success: false, error: "Password is not match" }, { status: 409 });

        if (password.length < 8) return NextResponse.json({ success: false, error: "Must be more than 8 characters" }, { status: 409 });

        const cleanEmail = email.trim().toLowerCase();

        const cleanAssign_by = "admin";

        const checkCodeUrl = new URL(api_link.checkcode, req.nextUrl.origin).toString();
        const response_code = await Fetch_to(checkCodeUrl, { email: cleanEmail, key: "confirm_code" });
        if (!response_code.success) return NextResponse.json({ success: false, error: response_code.message }, { status: 405 });

        if (cleanEmail === cleanAssign_by) return NextResponse.json({ success: false, error: "Email you provided is in conflict"}, { status: 409 });

        const cleanName = name
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^A-Za-z\s]/g, "")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

        const hashed = await bcrypt.hash(password, 10);

        const status = role === "Business" ? "active" : "suspend";

        const { error } = await supabaseServer
        .from("auth")
        .insert([{ email: cleanEmail, password: String(hashed), f_name: cleanName, year: year, status: status, role: role, assign_by: cleanAssign_by }]);

        await supabaseServer.from("setting").insert([{ state: "open", target: "suspend", email: cleanEmail }]);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        await supabaseServer
        .from("system_logs")
        .insert({ request: cleanEmail });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: cleanEmail,
            subject: `Welcome to LACO AI`,
            html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:36px 24px; text-align:center;">
                                    <div style="font-size:40px; line-height:1; margin-bottom:8px;">🎉</div>
                                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Welcome to LACO AI</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px 32px 8px 32px; text-align:center;">
                                    <p style="margin:0 0 16px 0; font-size:15px; color:#808080;">Your account has been created for</p>
                                    <p style="margin:0 0 24px 0; font-size:16px; font-weight:600; color:#213b94; background-color:#f0f6f7; display:inline-block; padding:8px 16px; border-radius:6px;">
                                        ${cleanEmail}
                                    </p>
                                    <p style="margin:0 0 28px 0; font-size:15px; line-height:1.6; color:#3c3c3c;">
                                        You're all set! You can now upload PDF documents and ask LACO AI questions to get instant explanations and insights.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 32px 36px 32px; text-align:center;">
                                    <a href="${process.env.APP_URL}" style="display:inline-block; background-color:#213b94; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:12px 28px; border-radius:8px;">
                                        Get Started
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

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}