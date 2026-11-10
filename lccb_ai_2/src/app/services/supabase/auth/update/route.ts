import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { rateLimit } from "@/firewall/rate_limit";
import { auth_jwt } from "@/firewall/jwt_auth";

export async function POST(req:NextRequest) {

    const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "update" });
    if (!rate.allowed) {
        const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
        return NextResponse.json(
            { success: false, error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }
    
    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    const email = auth.email;

    if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    try {

        const { error } = await supabaseServer
        .from("auth")
        .update({ f_name: name.trim() })
        .eq("email", email);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const refreshedSession = await auth_jwt(email);
        if (refreshedSession.error) {
            return NextResponse.json(
                { success: false, error: "Name was updated, but the session could not be refreshed" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "Successfully Update" }, { status: 200 });

    } catch(err) {
        console.log(err);
    }

}
