"use client";
import { Chat_bot, Sidebar } from "@/components/admin_business";
import { useState, useEffect } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function Chat_botPage() {
    const router = useRouter();
    const [nav, setNav] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            setEmail(response.data.message.final_data.data[0].email);
            setName(response.data.message.final_data.data[0].f_name);
        }
        check();
    }, []);

    useEffect(() => {
        setNav("document");
    }, [nav]);

    return (
        <main className="admin">
            <Sidebar nav={nav} email={email} f_name={name} />
            <Chat_bot email={email} />
        </main>
    );
}