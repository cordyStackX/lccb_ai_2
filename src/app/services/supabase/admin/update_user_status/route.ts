import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if (auth?.error) return auth.error;
   
    try {

        const { id, status } = await req.json();

        const { data, error } = await supabaseServer
        .from("auth")
        .update({ status: status })
        .eq("id", id);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data }, { status: 200 });

    } catch(err) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }
   

}