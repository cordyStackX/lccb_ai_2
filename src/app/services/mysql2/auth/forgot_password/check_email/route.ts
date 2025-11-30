import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/mysql2/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: NextRequest) {
    try {

        const { email } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 404 });
        
        const [rows] = await db.query("SELECT * FROM auth WHERE email = ?", [email]) as [RowDataPacket[], unknown];

        console.log(" ==> User trying to forgot password");

        if (rows.length !> 0) return NextResponse.json({ success: true }, { status: 200 });

        return NextResponse.json({ success: false, error: "Email not exist" }, { status: 409 });

    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}