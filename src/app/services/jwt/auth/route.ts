import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    if (!email) return NextResponse.json({ success: false, error: "Email Not Found" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("auth")
    .select("id, f_name, email")
    .eq("email", email)
    .limit(1);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    const token = jwt.sign(
        { data },
        process.env.JWT_SECRET || "",
        { expiresIn: "120h" }
    );

    const cookieStore = await cookies();
    cookieStore.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 3600,
    });

    console.log(" ==> User is Successfully Log In");

    return NextResponse.json({ success: true }, { status: 200 });
}
