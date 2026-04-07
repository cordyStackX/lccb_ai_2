import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const isJanFirstUtc = now.getUTCMonth() === 0 && now.getUTCDate() === 1;

    if (isJanFirstUtc) {
        const { error: deleteError } = await supabaseServer
            .from("API_logs")
            .delete()
            .neq("id", 0);

        if (deleteError) {
            console.error("Supabase Delete Error: ", deleteError);
            return NextResponse.json({ success: false, error: "Failed to rotate API logs" }, { status: 500 });
        }
    }
    
    const { data, error } = await supabaseServer
        .from("API_logs")
        .select("*");

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}