import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "check_email" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    try {

        const { email } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 404 });
        
        const cleanEmail = email.trim().toLowerCase();
        
        const { data, error } = await supabaseServer
        .from("auth")
        .select("email")
        .eq("email", cleanEmail);

       if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        console.log(" ==> User trying to forgot password ", data);

        if (!data || data.length === 0) return NextResponse.json({ success: false, error: "Email not exist" }, { status: 409 });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}