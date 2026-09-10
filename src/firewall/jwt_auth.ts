"use server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { decryptText } from "@/firewall/encryptions";

export async function auth_jwt(email: string) {
    const { data, error } = await supabaseServer
        .from("auth")
        .select("id, f_name, email, status, role")
        .eq("email", email)
        .limit(1);

    if (error) {
        console.error("Supabase Query Error: ", error);
        return { error: true, message: "Something went wrong", status: 500 };
    }

    if (!data || data.length === 0) {
        return { error: true, message: "User not found", status: 404 };
    }

    const user = data[0];

    if (user.status !== "active") {
        return { error: true, message: "Account is not active. Please contact support.", status: 403 };
    }

    let roleData = null;

    if (user.role === "Student") {
        const { data: data_student, error: err_student } = await supabaseServer
            .from("auth_student")
            .select("year, department, school_id")
            .eq("email", email)
            .limit(1);

        if (err_student) {
            console.error("Supabase Query Error: ", err_student);
            return { error: true, message: "Something went wrong", status: 500 };
        }

        if (!data_student || data_student.length === 0) {
            return { error: true, message: "Student record not found", status: 404 };
        }

        const { school_id, ...rest } = data_student[0];
        const de_hashed = decryptText(school_id, process.env.API_KEY || "");
        roleData = { ...rest, school_id: de_hashed };
    }

    if (user.role === "Business") {
        const { data: data_business, error: err_business } = await supabaseServer
            .from("auth_business")
            .select("current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb, institutions, business_name")
            .eq("email", email)
            .limit(1);

        if (err_business) {
            console.error("Supabase Query Error: ", err_business);
            return { error: true, message: "Something went wrong", status: 500 };
        }
        roleData = data_business?.[0] ?? null;
    }

    const final_data = { ...user, ...roleData };

    const token = jwt.sign({ final_data }, process.env.JWT_SECRET || "", { expiresIn: "30d" });

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

    return { error: false, role: user.role };
}