"use client";
import { SignUp } from "@/components/auth";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mobile = searchParams.get('mobile');
    const [inMobile, setInMobile] = useState(false);

    useEffect(() => {
            async function check() {
                const response = await Fetch_to(api_link.jwt.verify);
                if(!response.success || inMobile) return;
                const response_admin = response.data.message.final_data.data[0].email;
                if (response.success && response_admin === "admin@admin.com") return router.push("/admin/dashboard");
                return router.push("/chat");
            }
            check();
            function mobileCheck() {
                if (mobile) return setInMobile(true);
                setInMobile(false);
            }
            mobileCheck();
        }, [mobile]);

    return(
        <main className="auth_page">
            <SignUp mobile={inMobile} />
        </main>
    );

}

export default function SignUpPage() {
    return (
        <Suspense fallback={null}>
            <SignupContent />
        </Suspense>
    );
}