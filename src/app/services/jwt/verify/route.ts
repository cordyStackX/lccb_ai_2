import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST() {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
        return NextResponse.json({ success: false, error: "UnAuth" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
        if (!decoded) return NextResponse.json({ success: false, error: "Secret Not Found" }, { status: 404 });
        console.log(" ==> User Authenticated");
        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ success: false, error: "UnAuth" }, { status: 401 });
    }
}
