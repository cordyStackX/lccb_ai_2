"use client";

import { Embeded_code } from "@/components/admin";
import { useAdminSession } from "@/components/admin/AdminShell";

export default function EmbedCodePage() {
    const { email } = useAdminSession();
    return <Embeded_code email={email} />;
}
