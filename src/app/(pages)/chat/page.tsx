"use client";
import { 
    Sidebars, 
    Main, 
    Header,
    Profile
} from "@/components/chat";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fetch_to, useConfirmExit } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

function ChatContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mobile = searchParams.get('mobile');
    const [inMobile, setInMobile] = useState(false);
    const [inMobileHead, setInMobileHead] = useState(false);
    const [isOpen, setOpen] = useState(false);
    const [globalRefresh, setGlobalRefresh] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [year, setYear] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [currentPdf, setCurrentPdf] = useState<number | undefined>();
    const [currentImg, setCurrentImg] = useState<string | undefined>();

    useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (!response.success) return router.push("/");
            const result = response.data.message.final_data.data[0];
            setEmail(result.email);
            setName(result.f_name);
            setRole(result.role);
            setYear(result.year);
            if (result.status === "suspend") {
                alert("Account SUSPENDED please contact admin");
                router.push("/auth/signin");
                return await Fetch_to(api_link.jwt.deauth);
            }
            if (mobile === "open-chat") {
                setInMobile(false);
                setInMobileHead(true);
            } else if (mobile === "true") {
                setInMobile(true);
                setInMobileHead(true);
            }

        }
        check();
    }, []);

    useConfirmExit({
        onConfirm: () => router.back()
    });

    useEffect(() => {
        async function check() {
            const response2 = await Fetch_to(api_link.storage.fetchimg, { email: email });
            if (response2.success) {
                let result = response2.data.message[0].file_link;
                if (result < 0) return setProfilePic("");
                setProfilePic(result);
                console.log("Image Public link: ", response2.data.message[0].file_link);
            } else {
                setProfilePic("");
            }
        }
        check();
    }, [email, globalRefresh]);

    return(
        <main className="chat_page">
            <Header isOpen={isOpen} setOpen={setOpen} setShowProfile={setShowProfile} name={name} email={email} profilePic={profilePic} inMobile={inMobileHead} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                <Sidebars isOpen={isOpen} emailRes={email} setCurrentPdf={setCurrentPdf} setCurrentImg={setCurrentImg} globalRefresh={globalRefresh} />
                <Main emailRes={email} currentPdf={currentPdf} currentImg={currentImg} setGlobalRefresh={setGlobalRefresh} f_name={name} inMobile={inMobile} />
                <Profile showProfile={showProfile} setShowProfile={setShowProfile} email={email} name={name} role={role} year={year} profilePic={profilePic} setGlobalRefresh={setGlobalRefresh} />
            </div> 
        </main>
    );

}

export default function ChatPage() {
    return(
        <Suspense fallback={null} >
            <ChatContent />
        </Suspense>
    );
}