import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role?.toLowerCase() !== "admin") return NextResponse.json({ success: false, error: "Only administrators can delete sensitive documents" }, { status: 403 });
    
    const { id, filePath } = await req.json();

    if (!id || !filePath) return NextResponse.json({ success: false, error: "File Not Found" }, { status: 409 });

    const { data: document, error: lookupError } = await supabaseServer.from("chatbot_pdf_file_private")
        .select("id, file, email").eq("id", id).maybeSingle();
    if (lookupError || !document || document.file !== filePath || document.email?.toLowerCase() !== auth.email?.toLowerCase()) {
        return NextResponse.json({ success: false, error: "Sensitive document not found" }, { status: 404 });
    }

    const { data: storage, error: setError } = await supabaseServer.storage
    .from("chatbot_pdfs")
    .remove([filePath]);

    if (setError) {
        console.error("Supabase Query Error: ", setError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    console.log("storage delete response:", storage, setError);

    const { data, error } = await supabaseServer
    .from("chatbot_pdf_file_private")
    .delete()
    .eq("id", id);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });

}
