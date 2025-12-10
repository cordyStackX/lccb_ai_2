"use client";
import { Dashboard, Sidebar } from "@/components/admin";
import { useEffect, useState } from "react";
import { Fetch_to } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function DashboardPage() {
    const router = useRouter();
    const [nav, setNav] = useState("");

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
        }
        check();
    }, []);

    useEffect(() => {
        setNav("dashboard");
    }, [nav]);
    
    return (
        <main className="admin display_flex_center">
            <Sidebar nav={nav} />
            <Dashboard />
        </main>
    );
}