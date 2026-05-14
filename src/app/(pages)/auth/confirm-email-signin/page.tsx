"use client";
import { Confirm_email_signin } from "@/components/auth";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ConfirmEmailSigninContent() {
    const searchParams = useSearchParams();
    const mobile = searchParams.get('mobile');
    const [inMobile, setInMobile] = useState(false);

    useEffect(() => {
        function mobileCheck() {
            if (mobile) return setInMobile(true);
            setInMobile(false);
        }
        mobileCheck();
    }, [mobile]);

    return(
        <main className="auth_page">
            <Confirm_email_signin mobile={inMobile} />
        </main>
    );
}

export default function ConfirmEmailSigninPage() {
    return(
        <Suspense fallback={null} >
            <ConfirmEmailSigninContent />
        </Suspense>
    );
}