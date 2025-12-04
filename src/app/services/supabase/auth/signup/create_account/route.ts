import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {

        const { email, password, c_password } = await req.json();

        if (password !== c_password) return NextResponse.json({ succes: false, error: "Password is not match" }, { status: 409 });

        if (password.length < 8) return NextResponse.json({ success: false, error: "Must be more than 8 characters" }, { status: 409 });

        if (!email || !password) return NextResponse.json({ success: false, error: "You Rejected Invalid Info" }, { status: 404 });
        
        const cleanEmail = email.trim().toLowerCase();

        const hashed = await bcrypt.hash(password, 10);

        const { data, error } = await supabaseServer
        .from("auth")
        .insert([{ email: cleanEmail, password: String(hashed) }]);

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

        console.log(" ==> User Successfully Created an Account ", data);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}