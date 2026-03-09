"use client";
// import { Fetch_to } from "@/utilities";
// import api_link from "@/config/conf/json_config/fetch_url.json";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
import { 
    Header, ChatArea, ChatHistory, PdfFile
} from "@/components/chat";

export default function Chat() {
    // const router = useRouter();

    // useEffect(() => {
    //     async function check() {
    //         const response = await Fetch_to(api_link.jwt.verify);
    //         if (!response.success) return router.push("/");
    //     }
    //     check();
    // }, []);

    return(
       <main className="chat_page_2">
            <Header />
            <div style={{ display:"flex", justifyContent: "space-around", alignItems: "center", width: "100%", height: "100dvh", paddingTop: "50px"}}>
                <ChatHistory />
                <PdfFile />
                <ChatArea/>
            </div>
       </main>
    );

}