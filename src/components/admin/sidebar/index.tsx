"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
    nav: string;
}


export default function Sidebar({ nav } : SidebarProps) {
    const router = useRouter();
    const [nav_status, setNav_status] = useState("");

    useEffect(() => {
        setNav_status(nav);
    }, [nav]);


    return(
        <aside className={`${styles.container} display_flex_center`}>
            <figure className={`${styles.admin} display_flex_center`}>
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
            <section className={`${styles.options} display_flex_center`}>
                <button 
                disabled={nav_status === "dashboard" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "dashboard" ? "var(--default-color-white)" : "" }`,
                    color: `${ nav_status === "dashboard" ? "var(--default-color-black)" : "" }`    
                }}
                onClick={() => {router.push("/admin/dashboard");}}
                >Dashboard</button>
                <button
                disabled={nav_status === "manage_user" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "manage_user" ? "var(--default-color-white)" : "" }`,
                    color: `${ nav_status === "manage_user" ? "var(--default-color-black)" : "" }`    
                }}
                onClick={() => {router.push("/admin/manageuser");}}
                >Manage User</button>
                <button
                disabled={nav_status === "chat_bot" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "chat_bot" ? "var(--default-color-white)" : "" }`,
                    color: `${ nav_status === "chat_bot" ? "var(--default-color-black)" : "" }`    
                }}
                onClick={() => {router.push("/admin/chatbot");}}
                >Chat Bot</button>
                <button
                disabled={nav_status === "setting" ? true : false}
                style={{ 
                    backgroundColor: `${ nav_status === "setting" ? "var(--default-color-white)" : "" }`,
                    color: `${ nav_status === "setting" ? "var(--default-color-black)" : "" }`    
                }}
                onClick={() => {router.push("/admin/setting");}}
                >Setting</button>
            </section>
            <section className={`${styles.options_2} display_flex_center`}>
                <button>Sign Out</button>
            </section>
        </aside>
    );
}