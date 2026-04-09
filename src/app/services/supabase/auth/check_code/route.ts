import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { attemptMap, cooldownMap, CodeStore } from "@/lib/code_store";

const COOLDOWN_MS = 60 * 3000; // 3 minute

export async function POST(req: NextRequest) {

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

        const isAdmin = recipient.endsWith("@admin.com");
        const targetEmail = isAdmin ? process.env.GMAIL_USERNAME : recipient;

        if (!targetEmail) {
            throw new Error("GMAIL_USERNAME is not configured");
        }

        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: targetEmail,
            subject: "Verification Code",
            priority: "high" as const,
            headers: {
                Importance: "High",
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
            },
            html: `
                <p>Hello ${isAdmin ? "Admin" : recipient},</p>
                <h3>Your Code:</h3>
                <h1 style="
                color: #fff;
                font-weight: bold;
                background-color: #043988;
                padding: 10px;
                border-radius: 10px;
                ">${confirmationCode}</h1>
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
