"use client";
import { PendingPayments, Sidebar } from "@/components/admin";
import { useEffect, useState } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function Embeded_codePage() {
    const router = useRouter();
    const [nav, setNav] = useState("");
    const [data, setData] = useState({
        email: ""
    });

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            const result = response.data.message.final_data;
            if(result.email !== "")
            setData(prev => ({ ...prev, email: result.email }));
        }
        check();
    }, []);

    useEffect(() => {
        setNav("pending_payment");
    }, [nav]);

    return(
        <main className="admin">
            <Sidebar nav={nav} />
            <PendingPayments email={data.email} />
        </main>
    );
}