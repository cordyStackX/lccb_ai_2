"use server";

import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET() {
    

    try {

        const { error } = await supabaseServer
        .from("*")     
        .select("*")
        .limit(1);

        if (error) throw error;

        return NextResponse.json(
        { status: "healthy", message: " ==> Supabase connection successful" },
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
