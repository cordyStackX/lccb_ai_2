import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { cooldownMap, CodeStore } from "@/lib/code_store";
import { supabaseServer } from "@/lib/supabase-server";

const COOLDOWN_MS = 60 * 1000; // 1 minute


export async function POST(req: NextRequest) {

    const { email, code } = await req.json();

    if (!email) {
        console.error(" ==> User Email not exist");
        return NextResponse.json({ success: false, error: "Email Not Exist" }, { status: 404 });
    }
    
    const cleanEmail = email.trim().toLowerCase();

    const expiresAt = Date.now() + 60 * 1000; // 1 minutes

    //Check if their is existing code
    if (code) {
        const stored = CodeStore.get(cleanEmail);

        if (!stored) {
            return NextResponse.json(
                { success: false, error: "Code expired or not found" },
                { status: 400 }
            );
        }

        if (Date.now() > stored.expiresAt) {
            CodeStore.delete(cleanEmail);
            return NextResponse.json(
                { success: false, error: "Code expired" },
                { status: 409 }
            );
        }

        if (stored.code !== code) {
            return NextResponse.json(
                { success: false, error: "Invalid code" },
                { status: 409 }
            );
        }

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
        expiresAt
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    if (cleanEmail.endsWith("@admin.com")) {
        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: process.env.GMAIL_USERNAME,
            subject: "Verification Code",
            html: `
                <p>Hello Admin, ${process.env.GMAIL_USERNAME}</p>
                <h3>Your Code:</h3>
                <h1 style="
                color: #fff;
                font-weight: bold;
                background-color: #043988;
                padding: 10px;
                border-radius: 10px;
                ">${confirmationCode}</h1>
            `
        };

        try {

            await transporter.sendMail(mailOption);

            return NextResponse.json(
                { success: true, message: confirmationCode },
                { status: 200 }
            );

        } catch (err) {
            console.error(" ==> Email Failed: ", err);

            return NextResponse.json(
                { success: false, error: "Failed to send code" },
                { status: 500 }
            );
        }
    } else {

        const mailOption = {
            from: process.env.GMAIL_USERNAME,
            to: cleanEmail,
            subject: "Verification Code",
            html: `
                <p>Hello Admin, ${cleanEmail}</p>
                <h3>Your Code:</h3>
                <h1 style="
                color: #fff;
                font-weight: bold;
                background-color: #043988;
                padding: 10px;
                border-radius: 10px;
                ">${confirmationCode}</h1>
            `
        };

        try {

            await transporter.sendMail(mailOption);

            await supabaseServer
            .from("code_logs")
            .insert({ code: confirmationCode });

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

    

    
}
