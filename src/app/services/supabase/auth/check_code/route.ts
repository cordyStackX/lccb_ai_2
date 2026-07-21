import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { attemptMap, cooldownMap, CodeStore } from "@/lib/code_store";
import { rateLimit } from "@/lib/rate_limit";

const COOLDOWN_MS = 60 * 3000; // 3 minute

export async function POST(req: NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "check_code" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    const { email, code, key } = await req.json();

    if (!email) {
        console.error(" ==> User Email not exist");
        return NextResponse.json({ success: false, error: "Credential is Invalid" }, { status: 404 });
    }
    
    const cleanEmail = email.trim().toLowerCase();

    if (key === "confirm_code") {
        const stored = CodeStore.get(cleanEmail);
        if (!stored?.confirm_code) return NextResponse.json({ success: false, error: "Request Terminated" }, { status: 429 });
        CodeStore.delete(cleanEmail);
        attemptMap.delete(cleanEmail);
        cooldownMap.delete(cleanEmail);
        return NextResponse.json({ success: true }, { status: 200 });
    }

    const expiresAt = Date.now() + 60 * 3000; // 3 minutes

    const nextAttempt = (attemptMap.get(cleanEmail) ?? 0);

    const sendCodeEmail = async (recipient: string, confirmationCode: string) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const resolveEmail = (email: string) => {
            if (email === process.env.ADMIN_ALIAS) {
                console.log("Admin Loggin as ", process.env.GMAIL_USERNAME);
                return process.env.GMAIL_USERNAME;
            }
            return email;
        };

        const targetEmail = resolveEmail(recipient);

        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: targetEmail,
            subject: "Your LACO AI Verification Code",
            priority: "high" as const,
            headers: {
                Importance: "High",
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
            },
            html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background:linear-gradient(135deg, #017d93, #3fa5b7); padding:28px 24px; text-align:center;">
                                    <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">Verification Code</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:32px 32px 8px 32px; text-align:center;">
                                    <p style="margin:0 0 4px 0; font-size:15px; color:#3c3c3c;">Hello ${recipient},</p>
                                    <p style="margin:0 0 24px 0; font-size:14px; color:#808080;">Use the code below to verify your account. This code will expire shortly.</p>
                                    <div style="display:inline-block; background-color:#213b94; color:#ffffff; font-size:32px; font-weight:700; letter-spacing:6px; padding:16px 28px; border-radius:10px; margin-bottom:24px;">
                                        ${confirmationCode}
                                    </div>
                                    <p style="margin:0 0 28px 0; font-size:13px; color:#808080;">
                                        If you didn't request this code, you can safely ignore this email.
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

        await transporter.sendMail(mailOption);
    };

    //Check if their is existing code
    if (code) {
        const stored = CodeStore.get(cleanEmail);

        if (nextAttempt >= 5) {
            CodeStore.delete(cleanEmail);
            return NextResponse.json(
                { success: false, error: "Too many attempts. Please try again later" },
                { status: 429 }
            );
        }

        if (!stored) {
            return NextResponse.json(
                { success: false, error: "Code expired or not found" },
                { status: 400 }
            );
        }

        if (Date.now() > stored.expiresAt) {
            CodeStore.delete(cleanEmail);
            attemptMap.delete(cleanEmail);
            return NextResponse.json(
                { success: false, error: "Code expired" },
                { status: 409 }
            );
        }

        if (stored.code !== code) {
            attemptMap.set(cleanEmail, nextAttempt + 1);

            return NextResponse.json(
                { success: false, error: "Invalid code" },
                { status: 409 }
            );
        }


        CodeStore.set(cleanEmail, {
            code: code,
            expiresAt,
            confirm_code: code
        });

        // Code correct
        return NextResponse.json({ success: true }, { status: 200 });
    }

    // === Cooldown check ===
    const lastRequest = cooldownMap.get(cleanEmail);
    const now = Date.now();

    if (lastRequest && now - lastRequest < COOLDOWN_MS) {
        const secondsLeft = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);

        return NextResponse.json(
            {
                success: true,
                error: `Please wait ${secondsLeft}s before requesting another code.`
            },
            { status: 429 }
        );
    }

    // Save new timestamp
    cooldownMap.set(cleanEmail, now);

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    CodeStore.set(cleanEmail, {
        code: confirmationCode,
        expiresAt,
        confirm_code: ""
    });

    try {
        await sendCodeEmail(cleanEmail, confirmationCode);
        attemptMap.delete(cleanEmail);
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    } catch (err) {
        console.error(" ==> Email Failed: ", err);

        return NextResponse.json(
            { success: false, error: "Failed to send code" },
            { status: 500 }
        );
    }
}
