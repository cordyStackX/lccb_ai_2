import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";

type SessionToken = {
  final_data?: {
    email?: string;
    f_name?: string;
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

  return (
    <AdminShell email={email} f_name={session!.final_data?.f_name ?? ""}>
      {children}
    </AdminShell>
  );
}
