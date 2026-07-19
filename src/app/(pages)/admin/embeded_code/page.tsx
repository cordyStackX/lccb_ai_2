"use client";
import { Embeded_code, Sidebar } from "@/components/admin";
import { useEffect, useState } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function Embeded_codePage() {
    const router = useRouter();
    const [nav, setNav] = useState("");

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
        }
        check();
    }, []);

    useEffect(() => {
        setNav("embeded_code");
    }, [nav]);

    return(
        <main className="admin">
            <Sidebar nav={nav} />
            <Embeded_code />
        </main>
    );
}