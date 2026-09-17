"use client";

import { Main } from "@/components/chat_bot";

export default function ChatPageContent({ email }: { email: string }) {
    if (!email) return <p>Missing email parameter.</p>;

    return <main className="chat_page"><Main email={email} /></main>;
}
