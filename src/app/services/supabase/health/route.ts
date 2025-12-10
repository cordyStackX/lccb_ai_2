// app/api/health/route.ts
"use server";

import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET() {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    try {

        const { data, error } = await supabaseServer
        .from("auth")     
        .select("id")
        .limit(1);

        if (error) throw error;

        return NextResponse.json(
        { status: "healthy", message: " ==> Supabase connection successful", data },
        { status: 200 }
        );
    } catch (err) {
        console.error(" ==> Supabase health check failed:", err);

        return NextResponse.json(
        {
            status: "unhealthy",
            message: "Supabase connection failed",
            error: err instanceof Error ? err.message : "Unknown error"
        },
        { status: 503 }
        );
    }
}
