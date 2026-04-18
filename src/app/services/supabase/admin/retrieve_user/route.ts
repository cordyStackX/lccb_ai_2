import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    
    try {
        const { page = 1, limit = 30, search = "" } = await req.json().catch(() => ({ page: 1, limit: 30, search: "" }));
        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 30));
        const rangeFrom = (currentPage - 1) * pageSize;
        const rangeTo = rangeFrom + pageSize - 1;
        const term = String(search || "").trim();

        let query = supabaseServer
            .from("auth")
            .select("*", { count: "exact" })
            .neq("email", "admin@admin.com");

        if (term) {
            const safeTerm = term.replace(/[%_]/g, "\\$&");
            query = query.or(
                `f_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%,year.ilike.%${safeTerm}%,status.ilike.%${safeTerm}%,role.ilike.%${safeTerm}%`
            );
        }

        const { data, count, error } = await query.range(rangeFrom, rangeTo);

        if (error) {
            console.error("Supabase Query Error: ", error);
            return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
        }

        const total = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        const sanitizedData = (data ?? []).map(({ password, ...rest }) => rest);

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