"use client";
import { Dashboard, Sidebar} from "@/components/admin_business";
import { useEffect, useState } from "react";
import { Fetch_to, Progress } from "@/utilities";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function DashboardPage() {
    const router = useRouter();
    const [nav, setNav] = useState("");
    const [data, setData] = useState({
        email: "", name: "", current_limit: 0, current_pdf_limit: 0, current_pdf_limit_per_mb: 0, current_plan: ""
    });

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            const result = response.data.message.final_data.data[0];
            setData(prev => ({ ...prev, 
                email: result.email,
                name: result.f_name,
                current_limit: result.current_limit,
                current_pdf_limit: result.current_pdf_limit,
                current_pdf_limit_per_mb: result.current_pdf_limit_per_mb,
                current_plan: result.current_plan
             }));
            return;
        }
        check();
    }, []);

    useEffect(() => {
        setNav("dashboard");
    }, [nav]);
    
    return (
        <main className="admin">
            <Sidebar nav={nav} email={data.email} f_name={data.name} />
            <Dashboard email={data.email} current_limit={data.current_limit} current_pdf_limit={data.current_pdf_limit} current_pdf_limit_per_mb={data.current_pdf_limit_per_mb} current_plan={data.current_plan} />
        </main>
    );
}