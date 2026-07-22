"use client";
import { SignUpBusiness } from "@/components/auth";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupContent() {
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if(!response.success) return;
            const response_admin = response.data.message.final_data.data[0].email;
            if (response.success && response_admin === "admin@admin.com") return router.push("/admin/dashboard");
            return router.push("/chat");
        }
        check();
    }, []);

    return(
        <main className="auth_page">
            <SignUpBusiness />
        </main>
    );

}