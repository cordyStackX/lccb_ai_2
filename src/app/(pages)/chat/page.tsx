"use client";
import { 
    Sidebars, 
    Main, 
    Header,
    Profile
} from "@/components/chat";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

export default function ChatPage() {
    const router = useRouter();
    const [isOpen, setOpen] = useState(true);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [year, setYear] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [currentPdf, setCurrentPdf] = useState<number | undefined>();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            const result = response.data.message.final_data.data[0];
            const result2 = response.data.message.final_data.profile_links[0];
            console.log(result);
            setEmail(result.email);
            setName(result.f_name);
            setRole(result.role);
            setYear(result.year);
            if (!result2) return;
            setProfilePic(result2.file_link);
        }
        check();
    }, []);

    return(
        <main className="chat_page">
            <Header isOpen={isOpen} setOpen={setOpen} setShowProfile={setShowProfile} name={name} email={email} profilePic={profilePic} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                <Sidebars isOpen={isOpen} emailRes={email} setCurrentPdf={setCurrentPdf} />
                <Main emailRes={email} currentPdf={currentPdf}/>
                <Profile showProfile={showProfile} setShowProfile={setShowProfile} email={email} name={name} role={role} year={year} profilePic={profilePic} />
            </div> 
        </main>
    );

}