import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/lib/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { state } = body;

        // Update setting
        const { error } = await supabaseServer
        .from("setting")
        .update([{ state: state }])
        .eq("target", "suspend");

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            state,
            message: `API connections ${state === "suspend" ? "suspended" : "restored"}`,
        });
    } catch (e) {
        console.error("Error updating suspension state:", e);
        return NextResponse.json(
            { error: "Failed to update suspension state" },
            { status: 500 }
        );
    }
}
