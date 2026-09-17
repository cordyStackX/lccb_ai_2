import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";

type TokenPayload = {
  final_data?: {
    email?: string;
    role?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookieToken = (await cookies()).get("token")?.value;
  const token = bearer || cookieToken;

  const apikey = process.env.API_KEY;
  if (!apikey) return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
  if (!token) return NextResponse.json({ success: false, error: "UnAuth" }, { status: 403 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as TokenPayload;
    const email = decoded.final_data?.email;

    // Subscription limits can change after an administrator approves a
    // payment. They must come from the database rather than the seven-day JWT.
    if (email && decoded.final_data?.role === "Business") {
      const { data: business, error } = await supabaseServer
        .from("auth_business")
        .select("current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb, institutions, business_name")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Business subscription lookup error:", error);
        return NextResponse.json({ success: false, error: "Unable to retrieve subscription details" }, { status: 500 });
      }

      if (business) {
        decoded.final_data = { ...decoded.final_data, ...business };
      }
    }

    return NextResponse.json({ success: true, message: decoded }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "UnAuth" }, { status: 401 });
  }
}
