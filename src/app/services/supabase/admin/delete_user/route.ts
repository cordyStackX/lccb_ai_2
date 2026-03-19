import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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

    const { data: profile, error: profile_error } = await supabaseServer
    .from("profile_pic")
    .select("file_name")
    .eq("email", cleanEmail);

     if (profile_error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    console.log(data);

    if(data && profile) {

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

        const profile_pic_dir = `uploads/${email}_${profile[0].file_name}`;

        const { error: profile_Error } = await supabaseServer.storage
            .from("profile_pics")
            .remove([profile_pic_dir]);

        if (profile_Error) {
            console.error("Supabase Storage Error:", profile_Error);
            return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
        }

        console.log("Deleted:", profile_pic_dir);

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