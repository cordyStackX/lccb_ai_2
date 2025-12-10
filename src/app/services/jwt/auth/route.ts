import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    if (!email) return NextResponse.json({ success: false, error: "Email Not Found" }, { status: 404 });

    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET || "",
        { expiresIn: "1h" }
    );

    const cookieStore = await cookies();
    cookieStore.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: true,
        path: "/",
        maxAge: 3600,
    });

    console.log(" ==> User is Successfully Log In");

    return NextResponse.json({ success: true }, { status: 200 });
}
