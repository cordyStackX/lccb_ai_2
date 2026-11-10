"use client";

import { PendingPayments } from "@/components/admin";
import { useAdminSession } from "@/components/admin/AdminShell";

export default function PendingPaymentsPage() {
    const { email } = useAdminSession();
    return <PendingPayments email={email} />;
}
