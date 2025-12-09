"use client";
import { Chat_bot, Sidebar } from "@/components/admin";
import { useState, useEffect } from "react";

export default function Chat_botPage() {
    const [nav, setNav] = useState("");

    useEffect(() => {
        setNav("chat_bot");
    }, [nav]);

    return (
        <main className="admin display_flex_center">
            <Sidebar nav={nav} />
            <Chat_bot />
        </main>
    );
}