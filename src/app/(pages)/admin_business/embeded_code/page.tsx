"use client";
import { Embeded_code, Sidebar } from "@/components/admin_business";
import { useEffect, useState } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function Embeded_codePage() {
    const router = useRouter();
    const [nav, setNav] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            setEmail(response.data.message.final_data.data[0].email);
            setName(response.data.message.final_data.data[0].f_name);
        }
        check();
    }, []);

    useEffect(() => {
        setNav("embeded_code");
    }, [nav]);

    return(
        <main className="admin">
            <Sidebar nav={nav} email={email} f_name={name} />
            <Embeded_code email={email} />
        </main>
    );
}