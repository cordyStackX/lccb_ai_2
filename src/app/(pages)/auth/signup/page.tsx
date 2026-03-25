"use client";
import { SignUp } from "@/components/auth";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
            async function check() {
                const response = await Fetch_to(api_link.jwt.verify);
                if (response.success) return router.push("/chat");
            }
            check();
        }, []);

    return(
        <main className="auth_page">
            <SignUp />
        </main>
    );

}