import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    
    try {

        const { data,  error } = await supabaseServer
        .from("auth")
        .select("*");

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const filteredData = data?.filter((user) => user.email !== "admin@admin.com");

        return NextResponse.json({ success: true, message: filteredData }, { status: 200 });

    } catch (err) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}