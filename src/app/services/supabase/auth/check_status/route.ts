import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "check_status" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    const { email } = await req.json();

    if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("auth")
    .select("status")
    .eq("email", email);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (!data || data.length < 0) return NextResponse.json({ success: false, error: "Email Not Exist" }, { status: 409 });

    try {

        if (data[0].status === "active") {
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: "Account Has Been Suspended" }, { status: 409 });
        }

    } catch(err) {

        console.log(err);

        return NextResponse.json({ success: false, error: "Please Registered this Email" }, { status: 409 });

    }
}