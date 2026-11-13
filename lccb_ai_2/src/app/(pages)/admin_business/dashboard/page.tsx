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
        email: "", name: "", account_created_at: "", plan_expires_at: null as string | null, current_limit: 10000 as number | null, current_page_limit: 50, current_plan: ""
    });

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            Progress(false);
            const result = response.data.message.final_data;
            setData(prev => ({ ...prev, 
                email: result.email,
                name: result.f_name,
                account_created_at: result.created_at,
                plan_expires_at: result.plan_expires_at,
                current_limit: result.current_limit,
                current_page_limit: result.current_page_limit,
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
            <Dashboard email={data.email} account_created_at={data.account_created_at} plan_expires_at={data.plan_expires_at} current_limit={data.current_limit} current_page_limit={data.current_page_limit} current_plan={data.current_plan} />
        </main>
    );
}
