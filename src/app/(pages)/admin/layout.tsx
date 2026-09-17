import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

type SessionToken = {
  final_data?: {
    email?: string;
    role?: string;
  };
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get("token")?.value;
  let session: SessionToken;

  try {
    session = jwt.verify(token || "", process.env.JWT_SECRET || "") as SessionToken;
  } catch {
    redirect("/forbidden");
  }

  const email = session!.final_data?.email;
  if (!email) redirect("/forbidden");

  const { data: user, error } = await supabaseServer
    .from("auth")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();

  if (error || user?.status !== "active" || user.role?.toLowerCase() !== "admin") {
    redirect("/forbidden");
  }

  return children;
}
