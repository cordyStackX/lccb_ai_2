"use server";
import {  NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function Security(req: NextRequest) {

    const origin = req.headers.get("origin");

    const allowedOrigins = [
        process.env.APP_URL,
        "http://localhost:3000",
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
        return { error: NextResponse.json({ error: "CSRF blocked" }, { status: 410 }) };
    }

  
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
        return {
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            email: string
        };

        const { error } = await supabaseServer
        .from("auth")
        .select("status")
        .eq("email", decoded.email)
        .limit(1);

        if (error) {
            return {
                error: NextResponse.json({ error: "Unauthorized" }, { status: 402 }),
            };
        }

        return { error: false };

    } catch (err) {
        console.error("Security error:", err);
        return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 500 }),
        };
    }
}
