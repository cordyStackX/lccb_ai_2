"use client";

import { Chat_bot } from "@/components/admin";
import { useAdminSession } from "@/components/admin/AdminShell";

export default function DocumentsPage() {
    const { email } = useAdminSession();
    return <Chat_bot email={email} />;
}
