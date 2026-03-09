import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    try {

        const { email, password, c_password, name, year, role, assign_by } = await req.json();

        if (password !== c_password) return NextResponse.json({ succes: false, error: "Password is not match" }, { status: 409 });

        if (password.length < 8) return NextResponse.json({ success: false, error: "Must be more than 8 characters" }, { status: 409 });

        if (!email || !password) return NextResponse.json({ success: false, error: "You Rejected Invalid Info" }, { status: 404 });
        
        const cleanEmail = email.trim().toLowerCase();

        const cleanAssign_by = assign_by || "admin".trim().toLowerCase();

        if (cleanEmail === cleanAssign_by) return NextResponse.json({ success: false, error: "Email you provided is in conflict"}, { status: 409 });

        const cleanName = name
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^A-Za-z\s]/g, "")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

        const hashed = await bcrypt.hash(password, 10);

        if (role === "Teacher") {
            const status = "suspend";

            const { error } = await supabaseServer
            .from("auth")
            .insert([{ email: cleanEmail, password: String(hashed), f_name: cleanName, year: year, status: status, role: role, assign_by: cleanAssign_by }]);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

        } else {
            const status = "active";

            const { error } = await supabaseServer
            .from("auth")
            .insert([{ email: cleanEmail, password: String(hashed), f_name: cleanName, year: year, status: status, role: role, assign_by: cleanAssign_by }]);

            if (error) {
                console.error("Supabase Query Error: ", error);
                return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
            }

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
            to: cleanEmail,
            subject: `Welcome to LACO AI`,
            html:  `<style>
                

                .welcome-message {
                    animation: fadeIn 2s linear infinite;
                }

                @keyframes fadeIn {
                    0% { color: #fff; }
                    20% { color: #ff0; }
                    40% { color: #0ff; }
                    60% { color: #f00; }
                    70% { color: #0f0; }
                    100% { color: #00f; }
                }

                .header {
                    padding: 20px;
                    background-color: #0d1117;
                    border-radius: 10px;
                    color: #fff;
                    animation: fadeIn 2s ease-in-out;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .header:hover {
                    background-color: #23272a;
                    transition: background-color 0.3s ease;
                }
            </style>
            
            <p class="welcome-message"> 🎉😊 Welcome ${cleanEmail} </p>
            <h1 class="header">
                Welcome to my web applications, you have been successfully create your account congrats. 👻🤫🧏‍♂️🤭🥳
            </h1>`
        };

        await transporter.sendMail(mailOption);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}