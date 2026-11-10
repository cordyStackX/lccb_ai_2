"use client";

import { Setting } from "@/components/admin";
import { useAdminSession } from "@/components/admin/AdminShell";

export default function SettingPage() {
    const { email, f_name } = useAdminSession();
    return <Setting f_name={f_name} email={email} />;
}
