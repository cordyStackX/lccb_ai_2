"use client";

import { Dashboard } from "@/components/admin";
import { useAdminSession } from "@/components/admin/AdminShell";

export default function DashboardPage() {
    const { email } = useAdminSession();
    return <Dashboard email={email} />;
}
