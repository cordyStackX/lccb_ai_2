import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(params: NextRequest) {
  
  const auth = await Security(params);
  if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { email, page, limit, search } = await params.json();

  if (!email) return NextResponse.json({ success: false, error: "Email not Exist" }, { status: 404 });

  try {
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 100)
      : 30;
    const from = (currentPage - 1) * pageLimit;
    const to = from + pageLimit - 1;
    const paymentFilter = typeof search === "string" ? search.trim().toLowerCase() : "all";

    let query = supabaseServer
      .from("payments")
      .select("*", { count: "exact" });

    const statusFilters: Record<string, string[]> = {
      declined: ["decline", "declined", "failed", "failure", "rejected"],
      success: ["success", "successful", "paid", "active", "completed", "complete"],
      pending: ["pending"],
      refund_requested: ["refund_requested"],
    };

    if (paymentFilter in statusFilters) {
      query = query.in("status", statusFilters[paymentFilter]);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Supabase Query Error: ", error);
      return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: data,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageLimit)),
    }, { status: 200 });

  } catch (err) {
    console.error("BackEnd Error: ", err);
    return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
  }

}
