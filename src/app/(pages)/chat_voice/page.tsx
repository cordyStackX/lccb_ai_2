"use client";
// import { Main } from "@/components/chat_voice";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Fetch_to } from "@/utilities";
// import api_link from "@/config/conf/json_config/fetch_url.json";


export default function Chat_voice() {
    // const router = useRouter();
    // const [isOpen, setOpen] = useState(false);
    // const [globalRefresh, setGlobalRefresh] = useState(false);
    // const [email, setEmail] = useState("");
    // const [name, setName] = useState("");
    // const [role, setRole] = useState("");
    // const [year, setYear] = useState("");
    // const [profilePic, setProfilePic] = useState("");
    // const [showProfile, setShowProfile] = useState(false);
    // const [currentPdf, setCurrentPdf] = useState<number | undefined>();

    // useEffect(() => {
    //     async function check() {
    //         const response = await Fetch_to(api_link.jwt.verify);
    //         if (!response.success) return router.push("/");
    //         const result = response.data.message.final_data.data[0];
    //         setEmail(result.email);
    //         setName(result.f_name);
    //         setRole(result.role);
    //         setYear(result.year);
    //         if (result.status === "Suspended") {
                //     alert("Account SUSPENDED please contact admin");
                //     router.push("/auth/signin");
                //     return await Fetch_to(api_link.jwt.deauth);
                // }
    //     }
    //     check();
    // }, []);


    return(
        <main>
            <h1>Chat Voice</h1>
        </main>
    );

}