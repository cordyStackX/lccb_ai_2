import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email } = await req.json();

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const { data, error } = await supabaseServer
        .from("pdf_file")
        .select("id, file")
        .eq("email", cleanEmail);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    const { data: profile, error: profile_error } = await supabaseServer
        .from("profile_pic")
        .select("file_name")
        .eq("email", cleanEmail);

    if (profile_error) {
        console.error("Supabase Query Error: ", profile_error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (!data || !profile) {
        return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    // Delete PDF files from storage
    for (let i = 0; i < data.length; i++) {
        const path = data[i].file;

        const { error: setError } = await supabaseServer.storage
            .from("pdfs")
            .remove([path]);

        if (setError) {
            console.error("Supabase Storage Error:", setError);
            return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
        }
    }

    // Delete PDF file DB records
    const { error: pdfRowError } = await supabaseServer
        .from("pdf_file")
        .delete()
        .eq("email", cleanEmail);

    if (pdfRowError) {
        console.error("Supabase Query Error: ", pdfRowError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    // Delete profile picture from storage + DB
    if (profile.length > 0 && profile[0]?.file_name) {
        const profile_pic_dir = `uploads/${cleanEmail}_${profile[0].file_name}`;

        const { error: profile_Error } = await supabaseServer.storage
            .from("profile_pics")
            .remove([profile_pic_dir]);

        if (profile_Error) {
            console.error("Supabase Storage Error:", profile_Error);
            return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
        }

        const { error: profileRowError } = await supabaseServer
            .from("profile_pic")
            .delete()
            .eq("email", cleanEmail);

        if (profileRowError) {
            console.error("Supabase Query Error: ", profileRowError);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }
    }

    // Delete the account itself
    const { error: setError } = await supabaseServer
        .from("auth")
        .delete()
        .eq("email", cleanEmail);

    if (setError) {
        console.error("Supabase Query Error: ", setError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    // Notify the user their account was terminated
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOption = {
        from: process.env.GMAIL_USERNAME,
        to: cleanEmail,
        subject: "Your LACO AI Account Has Been Terminated",
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
                            <td style="background-color:#E94B3C; padding:28px 24px; text-align:center;">
                                <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">Account Terminated</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px 32px 8px 32px; text-align:center;">
                                <p style="margin:0 0 4px 0; font-size:15px; color:#3c3c3c;">Hello,</p>
                                <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#3c3c3c;">
                                    Your LACO AI account associated with <strong>${cleanEmail}</strong> has been terminated due to a violation of our Terms and Conditions.
                                </p>
                                <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#3c3c3c;">
                                    All data associated with this account — including uploaded documents, chat history, and your profile — has been permanently removed from our systems.
                                </p>
                                <p style="margin:0 0 28px 0; font-size:14px; line-height:1.6; color:#3c3c3c;">
                                    You are welcome to create a new account using this same email address at any time.
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

    return NextResponse.json({ success: true, message: "Terminated Successfully" }, { status: 200 });
}