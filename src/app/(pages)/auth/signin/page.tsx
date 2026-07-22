"use client";
import { SignIn } from "@/components/auth";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (response.success) {
				if (response.data.message.final_data.data[0].role === "admin") return router.push("/admin/dashboard");
				if (response.data.message.final_data.data[0].role === "Business") return router.push("/admin_business/dashboard");
				return router.push("/chat");
			}
        }
        check();
    }, []);

    

    return(
        <main className="auth_page">
            <SignIn />
        </main>
    );

}