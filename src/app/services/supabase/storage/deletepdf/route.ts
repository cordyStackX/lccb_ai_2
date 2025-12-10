import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    
    const { id, filePath } = await req.json();

    if (!id || !filePath) return NextResponse.json({ success: false, error: "File Not Found" }, { status: 409 });

    const { data: storage, error: setError } = await supabaseServer.storage
    .from("pdfs")
    .remove([filePath]);

    if (setError) {
        console.error("Supabase Query Error: ", setError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    console.log("storage delete response:", storage, setError);

    const { data, error } = await supabaseServer
    .from("pdf_file")
    .delete()
    .eq("id", id);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}