"use client";
import { Sidebars, Main } from "@/components";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Spin as Hamburger } from "hamburger-react";

export default function ChatPage() {
    const router = useRouter();
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
        }
        check();
    }, []);

    return(
        <main className="chat_page display_flex_left">
            <span style={{ position: "fixed", zIndex: "999" }}>
                    <Hamburger toggled={isOpen} toggle={setOpen}  />
            </span>
            <Sidebars isOpen={isOpen} />
            <Main />
        </main>
    );

}