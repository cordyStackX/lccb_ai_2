"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SweetAlert2, Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface SidebarProps {
    nav: string;
}


export default function Sidebar({ nav } : SidebarProps) {
    const router = useRouter();
    const [nav_status, setNav_status] = useState("");

    useEffect(() => {
        setNav_status(nav);
    }, [nav]);

    const handle_logout = async () => {

        const alert2 = await SweetAlert2("Signning Out", "Are you sure want to sign out?", "warning", true, "Yes", true, "No");

        if (alert2.isConfirmed) {
            SweetAlert2("Signning Out", "", "info", false, "", false, "", true);
            const response = await Fetch_to(api_link.jwt.deauth);
            Swal.close();
            if (response.success) {   
                const alert2 = await SweetAlert2("Sign Out", "Complete", "success", true, "Go to Signin Page", false, "");
                if (alert2.isConfirmed) { router.push("/auth/signin"); }
            } else {
                SweetAlert2("Error", "Something went wrong", "error", true, "Ok", false, "");
            }
            
        } 
    };

    return(
        <aside className={`${styles.container}`}>
            <figure className={`${styles.admin}`}>
                <Image 
                src={image_src.admin}
                alt="admin"
                title="admin"
                width={90}
                height={90}
                />    
                <figcaption>Admin</figcaption>
                <p>{process.env.NEXT_PUBLIC_GMAIL_USERNAME}</p>
            </figure>
            <section className={`${styles.options}`}>
                <button 
                disabled={nav_status === "dashboard" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "dashboard" ? "var(--fx-color)" : "" }`,
                    color: `${ nav_status === "dashboard" ? "var(--default-color-white)" : "" }`,
                    boxShadow: `${ nav_status === "dashboard" ? "0 0 10px 1px var(--primary)" : "" }`    
                }}
                onClick={() => {router.push("/admin/dashboard");}}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    </svg> 
                Dashboard</button>
                <button
                disabled={nav_status === "manage_user" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "manage_user" ? "var(--fx-color)" : "" }`,
                    color: `${ nav_status === "manage_user" ? "var(--default-color-white)" : "" }`,
                    boxShadow: `${ nav_status === "manage_user" ? "0 0 10px 1px var(--primary)" : "" }`    
                }}
                onClick={() => {router.push("/admin/manageuser");}}
                > 
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 20c0-4 4-6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 14l6-6 2 2-6 6-3 1 1-3z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                
                Manage User</button>
                <button
                disabled={nav_status === "chat_bot" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "chat_bot" ? "var(--fx-color)" : "" }`,
                    color: `${ nav_status === "chat_bot" ? "var(--default-color-white)" : "" }`,
                    boxShadow: `${ nav_status === "chat_bot" ? "0 0 10px 1px var(--primary)" : "" }`    
                }}
                onClick={() => {router.push("/admin/chatbot");}}
                >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="5" width="12" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="10" cy="11" r="1" fill="currentColor"/>
                <circle cx="14" cy="11" r="1" fill="currentColor"/>
                <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Chat Bot</button>
                <button
                disabled={nav_status === "setting" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "setting" ? "var(--fx-color)" : "" }`,
                    color: `${ nav_status === "setting" ? "var(--default-color-white)" : "" }`,
                    boxShadow: `${ nav_status === "setting" ? "0 0 10px 1px var(--primary)" : "" }`    
                }}
                onClick={() => {router.push("/admin/setting");}}
                >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="6" r="2" fill="currentColor"/>
                <circle cx="15" cy="12" r="2" fill="currentColor"/>
                <circle cx="11" cy="18" r="2" fill="currentColor"/>
                </svg>    
                Setting</button>
            </section>
            <section className={`${styles.options_2}`}>
                <button onClick={handle_logout}>Sign Out</button>
            </section>
        </aside>
    );
}