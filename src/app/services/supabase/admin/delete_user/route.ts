import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";


export async function POST(req: NextRequest) {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    const { email } = await req.json();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("pdf_file")
    .select("file")
    .eq("email", cleanEmail);
    
    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    console.log(data);

    if(data) {

        for (let i = 0; i < data.length; i++) {
            const path = data[i].file;

            const { error: setError } = await supabaseServer.storage
                .from("pdfs")
                .remove([path]);

            if (setError) {
                console.error("Supabase Storage Error:", setError);
                return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
            }

            console.log("Deleted:", path);
        }

        const { data: account, error: setError } = await supabaseServer
        .from("auth")
        .delete()
        .eq("email", cleanEmail);

        if (setError) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        console.log(account);

        return NextResponse.json({ success: true }, { status: 200 });
    }

    

}