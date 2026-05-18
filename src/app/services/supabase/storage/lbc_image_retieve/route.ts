import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error)
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );

    const { email } = await req.json();

    if (!email)
        return NextResponse.json(
            { success: false, error: "Email not found" },
            { status: 404 }
        );

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseServer
        .from("image_url")
        .select("email, image_link, image_name")
        .eq("email", cleanEmail)
        .single();

    if (error || !data?.image_link) {
        return NextResponse.json(
            { success: false, error: "Image not found" },
            { status: 404 }
        );
    }

    console.log(data);

    // 🔥 fetch image to calculate size
    let size = null;

    try {
        const res = await fetch(data.image_link);
        const buffer = await res.arrayBuffer();
        size = buffer.byteLength; // bytes
    } catch (err) {
        console.error("Image size fetch error:", err);
    }

    return NextResponse.json(
        {
            success: true,
            message: {
                email: data.email,
                image_link: data.image_link,
                image_name: data.image_name,
                size_bytes: size,
                size_kb: size ? Math.round(size / 1024) : null,
                size_mb: size ? Number((size / (1024 * 1024)).toFixed(2)) : null
            },
        },
        { status: 200 }
    );
}