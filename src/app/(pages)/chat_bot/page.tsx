"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Main } from "@/components/chat_bot";

function ChatPageContent() {
    const searchParams = useSearchParams();
    const email = decodeURIComponent(searchParams.get("email") ?? "");

    if (!email) {
        return <p>Missing email parameter.</p>;
    }

    return <Main email={email} />;
}

export default function ChatPage() {
    return (
        <main className="chat_page">
            <Suspense fallback={<p>Loading...</p>}>
                <ChatPageContent />
            </Suspense>
        </main>
    );
}