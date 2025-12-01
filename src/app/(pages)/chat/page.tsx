"use client";
import { Sidebars } from "@/components";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fetch_to } from "@/utilities";

export default function Chat() {
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to("services/jwt/verify");
            if (!response.success) return router.push("/");
        }
        check();
    }, []);

    return(
        <main className="chat_page display_flex_left">
            <Sidebars />
        </main>
    );

}