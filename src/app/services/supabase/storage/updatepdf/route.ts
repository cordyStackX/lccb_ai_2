import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
    
    const { id, status, email } = await req.json();

    const { data, error } = await supabaseServer
    .from("pdf_file")
    .select("id, status")
    .eq("email", email);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    const speakPdf = data?.find((pdf) => pdf.status === "Speak");
    if (speakPdf) {
        
      const { error: resetError } = await supabaseServer
        .from("pdf_file")
        .update({ status: "NoSpeak" })
        .eq("id", speakPdf.id);

      if (resetError) {
        console.error("Supabase Query Error: ", resetError);
        return NextResponse.json({ success: false, error: "Failed to reset previous Speak" }, { status: 500 });
      }

      const { data, error } = await supabaseServer
        .from("pdf_file")
        .update({ status: status })
        .eq("id", id);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data }, { status: 200 });

    } else {
        
        const { data, error } = await supabaseServer
        .from("pdf_file")
        .update({ status: status })
        .eq("id", id);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data }, { status: 200 });

    }
   

}