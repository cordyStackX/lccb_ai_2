import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { decryptText } from "@/firewall/encryptions";

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    const apikey = process.env.API_KEY;

    if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });

    if (!email) return NextResponse.json({ success: false, error: "Email Not Found" }, { status: 404 });

    const { data, error } = await supabaseServer
    .from("auth")
    .select("id, f_name, email, status, role")
    .eq("email", email)
    .limit(1);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = data[0];
    let roleData = null;

    if (user.role === "Student") {
        const { data: data_student, error: err_student } = await supabaseServer
            .from("auth_student")
            .select("year, department, school_id")
            .eq("email", email)
            .limit(1);

        if (err_student) {
            console.error("Supabase Query Error: ", err_student);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        if (!data_student || data_student.length === 0) {
            return NextResponse.json({ success: false, error: "Student record not found" }, { status: 404 });
        }

        const { school_id, ...rest } = data_student[0]; 
        const de_hashed = decryptText(school_id, process.env.API_KEY || "");

        roleData = { ...rest, school_id: de_hashed };
    }

    if (user.role === "Business") {
        const { data: data_business, error: err_business } = await supabaseServer
            .from("auth_business")
            .select("current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb")
            .eq("email", email)
            .limit(1);

        if (err_business) {
            console.error("Supabase Query Error: ", err_business);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }
        roleData = data_business?.[0] ?? null;
    }

    const final_data = {data, ...user, ...roleData };

    console.log(final_data);

    const token = jwt.sign(
        { final_data },
        process.env.JWT_SECRET || "",
        { expiresIn: "30d" }
    );

    const cookieStore = await cookies();
    cookieStore.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });

    console.log(" ==> User is Successfully Log In");

    return NextResponse.json({ success: true, token }, { status: 200 });
}
