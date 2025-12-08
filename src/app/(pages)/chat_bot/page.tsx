"use client";
import { Sidebars, Main, Header } from "@/components/chat_bot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function ChatPage() {
    const router = useRouter();
    const [isOpen, setOpen] = useState(true);
    const [email, setEmail] = useState("");
    const [refresh, setRefresh] = useState(false);
    const [currentPdf, setCurrentPdf] = useState<number | undefined>();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            setEmail(response.data.message.email);
        }
        check();
    }, []);

    return(
        <main className="chat_page display_flex_left">
            <Header isOpen={isOpen} setOpen={setOpen} />
            <div className="display_flex_center">
                <Sidebars isOpen={isOpen} emailRes={email} refresh={refresh} setCurrentPdf={setCurrentPdf} />
                <Main emailRes={email} refresh={refresh} setRefresh={setRefresh} currentPdf={currentPdf}/>
            </div>
        </main>
    );

}