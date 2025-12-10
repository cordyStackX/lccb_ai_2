import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function verifyJWT(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET!);
        return { user }; 
    } catch (err) {
        console.error("Error: ", err);
        return { error: NextResponse.json({ success: false, error: "Invalid token" }, { status: 403 }) };
    }
}
