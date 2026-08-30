import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { decryptText } from "@/firewall/encryptions";

type StudentRecord = {
    year?: string;
    department?: string;
    school_id?: string;
};

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    try {
        const { page = 1, limit = 30, search = "", year = "", role = "", status = "" } = await req
        .json()
        .catch(() => ({ page: 1, limit: 30, search: "", year: "", role: "", status: "" }));

        const currentPage = Math.max(1, Number(page) || 1);
        const statusFilter = String(status || "").trim();
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 30));
        const rangeFrom = (currentPage - 1) * pageSize;
        const rangeTo = rangeFrom + pageSize - 1;
        const term = String(search || "").trim();
        const yearFilter = String(year || "").trim();
        const roleFilter = String(role || "").trim();

        let query;

        if (yearFilter) {
            query = supabaseServer
                .from("auth")
                .select("*, auth_student!inner(year, department, school_id)", { count: "exact" })
                .neq("email", "admin@admin.com")
                .eq("role", "Student")
                .eq("auth_student.year", yearFilter);
        } else {
            query = supabaseServer
                .from("auth")
                .select("*, auth_student(year, department, school_id)", { count: "exact" })
                .neq("email", "admin@admin.com");
        }

        if (term) {
            const safeTerm = term.replace(/[%_]/g, "\\$&");
            query = query.or(
                `f_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%,status.ilike.%${safeTerm}%,role.ilike.%${safeTerm}%`
            );
        }

        if (roleFilter) {
            query = query.eq("role", roleFilter);
        }

        if (statusFilter) {
            query = query.eq("status", statusFilter);
        }
        const { data, count, error } = await query.range(rangeFrom, rangeTo);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const total = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        const decryptStudent = (student: StudentRecord) => {
            if (!student?.school_id) return student;
            try {
                return { ...student, school_id: decryptText(student.school_id, process.env.API_KEY || "") };
            } catch (decryptErr) {
                console.error("Decrypt Error:", decryptErr);
                return { ...student, school_id: null };
            }
        };

        const sanitizedData = (data ?? []).map((row) => {
            const rest = { ...row };
            delete rest.password;

            if (Array.isArray(rest.auth_student)) {
                rest.auth_student = rest.auth_student.map(decryptStudent);
            } else if (rest.auth_student) {
                rest.auth_student = decryptStudent(rest.auth_student);
            }
            return rest;
        });
        

        return NextResponse.json(
            {
                success: true,
                message: sanitizedData,
                page: currentPage,
                total,
                totalPages,
            },
            { status: 200 }
        );

    } catch (err) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}