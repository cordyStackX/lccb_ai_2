"use client";
import { Embeded_code, Sidebar } from "@/components/admin_business";
import { useEffect, useState } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function Embeded_codePage() {
    const router = useRouter();
    const [nav, setNav] = useState("");
    const [data, setData] = useState({
        email: "", f_name: ""
    });

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            const result = response.data.message.final_data.data;
            setData(prev => ({ ...prev, f_name: result[0].f_name, email: result[0].email }));
        }
        check();
    }, []);

    useEffect(() => {
        setNav("embeded_code");
    }, [nav]);

    return(
        <main className="admin">
            <Sidebar nav={nav} email={data.email} f_name={data.f_name} />
            <Embeded_code email={data.email} />
        </main>
    );
}