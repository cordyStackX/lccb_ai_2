"use client";
import { Sidebars, Main, Header } from "@/components/chat";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function ChatPage() {
    const router = useRouter();
    const [isOpen, setOpen] = useState(true);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [currentPdf, setCurrentPdf] = useState<number | undefined>();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            setEmail(response.data.message.data[0].email);
            setName(response.data.message.data[0].f_name);
        }
        check();
    }, []);

    return(
        <main className="chat_page">
            <Header isOpen={isOpen} setOpen={setOpen} name={name} email={email} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                <Sidebars isOpen={isOpen} emailRes={email} setCurrentPdf={setCurrentPdf} name={name} />
                <Main emailRes={email} currentPdf={currentPdf}/>
            </div> 
        </main>
    );

}