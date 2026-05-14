"use client";
import { Create_Password } from "@/components/auth";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CreatePasswordContent() {
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
            <Create_Password mobile={inMobile} />
        </main>
    );
}

export default function CreatePasswordPage() {
    return (
        <Suspense fallback={null}>
            <CreatePasswordContent />
        </Suspense>
    );
}