import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { supabaseServer } from "@/lib/supabase-server";
import { decryptText } from "@/firewall/encryptions";

export async function POST(params: NextRequest) {

  const auth = await Security(params);
  if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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
    const paymentSearch = typeof search === "string" ? search.trim() : "";

    let query = supabaseServer
      .from("payments")
      .select("id, amount, email, method, vat, status, account_number, created_at, reason", { count: "exact" })
      .eq("email", email);

    if (paymentSearch) {
      query = query.ilike("method", `%${paymentSearch}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase Query Error: ", error);
      return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    const decryptedData = (data ?? []).map((row) => {
      let account_number = row.account_number;
      try {
        account_number = row.account_number
          ? decryptText(row.account_number, process.env.API_KEY || "")
          : row.account_number;
      } catch (decryptErr) {
        console.error("Decrypt Error for row:", row.id, decryptErr);
        account_number = null;
      }
      return { ...row, account_number };
    });

    return NextResponse.json({
      success: true,
      message: decryptedData,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageLimit)),
    }, { status: 200 });

  } catch (err) {
    console.error("BackEnd Error: ", err);
    return NextResponse.json({ success: false, error: "Server is Down" }, { status: 500 });
  }

}
