"use client";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
    Header
} from "@/components/chat";

export default function Chat() {
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
        }
        check();
    }, []);

    return(
       <main className="chat_page_2 display_flex_center">
            <Header />
       </main>
    );

}