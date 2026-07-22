"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SweetAlert2, Fetch_to, Progress } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface SidebarProps {
    nav: string;
    email: string;
    f_name: string;
}

const NAV_ITEMS = [
    {
        key: "dashboard",
        label: "Dashboard",
        path: "/admin_business/dashboard",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
            </svg>
        ),
    },
    {
        key: "document",
        label: "Documents",
        path: "/admin_business/document",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M8 13h8M8 17h8M8 9h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: "embeded_code",
        label: "Embeded Code",
        path: "/admin_business/embeded_code",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 6L22 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.5 4L10.5 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: "setting",
        label: "Setting",
        path: "/admin_business/setting",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
                <circle cx="9" cy="6" r="2" fill="currentColor" />
                <circle cx="15" cy="12" r="2" fill="currentColor" />
                <circle cx="11" cy="18" r="2" fill="currentColor" />
            </svg>
        ),
    },
];

export default function Sidebar({ nav, email, f_name }: SidebarProps) {
    const router = useRouter();
    const [nav_status, setNav_status] = useState("");
    const [is_open, setIs_open] = useState(false);

    useEffect(() => {
        setNav_status(nav);
    }, [nav]);

    // close the mobile drawer whenever the route/nav changes
    useEffect(() => {
        setIs_open(false);
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

    return (
        <>
            {/* Burger button — only visible on mobile via CSS */}
            <button
                type="button"
                className={styles.burger}
                aria-label={is_open ? "Close menu" : "Open menu"}
                aria-expanded={is_open}
                onClick={() => setIs_open((prev) => !prev)}
            >
                <span className={`${styles.burgerBar} ${is_open ? styles.burgerBarOpenTop : ""}`} />
                <span className={`${styles.burgerBar} ${is_open ? styles.burgerBarOpenMid : ""}`} />
                <span className={`${styles.burgerBar} ${is_open ? styles.burgerBarOpenBot : ""}`} />
            </button>

            {/* Backdrop — only rendered/visible on mobile when open */}
            {is_open && (
                <div className={styles.backdrop} onClick={() => setIs_open(false)} />
            )}

            <aside className={`${styles.container} ${is_open ? styles.containerOpen : ""}`}>
                <figure className={styles.admin}>
                    <Image
                        src={image_src.admin}
                        alt="admin"
                        title="admin"
                        width={56}
                        height={56}
                        className={styles.avatar}
                    />
                    <span>
                        <figcaption> {f_name} </figcaption>
                        <p>{email}</p>
                    </span>
                </figure>

                <section className={styles.options}>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            disabled={nav_status === item.key}
                            className={`${styles.navButton} ${nav_status === item.key ? styles.navButtonActive : ""}`}
                            onClick={() => {router.push(item.path); Progress(true);}}
                        >
                            <span className={styles.navIndicator} />
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </section>

                <section className={styles.options_2}>
                    <button className={styles.logoutButton} onClick={handle_logout}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 17V7a2 2 0 0 1 2-2h7v14h-7a2 2 0 0 1-2-2z" />
                            <path d="M15 12H3m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Sign Out
                    </button>
                </section>
            </aside>
        </>
    );
}