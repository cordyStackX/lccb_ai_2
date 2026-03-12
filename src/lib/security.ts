"use server";
import {  NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";

// Cooldown tracking: Map<identifier, timestamp>
const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 20000; 

export async function Security(req: NextRequest) {

    const origin = req.headers.get("origin");

    const allowedOrigins = [
        process.env.APP_URL,
        "http://localhost:3000",
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
        return { error: NextResponse.json({ error: "CSRF blocked" }, { status: 410 }) };
    }

    // Get identifier for cooldown (IP address or user identifier)
    const identifier = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const lastRequest = cooldownMap.get(identifier);

    // Check cooldown
    if (lastRequest && (now - lastRequest) < COOLDOWN_MS) {
        return console.log("Too many request please try again");
    }

    // Update cooldown timestamp
    cooldownMap.set(identifier, now);

    // Cleanup old entries (keep map size manageable)
    if (cooldownMap.size > 1000) {
        const cutoff = now - (COOLDOWN_MS * 10);
        for (const [key, timestamp] of cooldownMap.entries()) {
            if (timestamp < cutoff) {
                cooldownMap.delete(key);
            }
        }
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
