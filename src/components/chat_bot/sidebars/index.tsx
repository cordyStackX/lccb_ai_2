"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useState, useEffect } from "react";
import { SweetAlert2, Fetch_to } from "@/utilities";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import api_link from "@/config/conf/json_config/fetch_url.json";

interface SidebarsProps {
    isOpen: boolean;
}

export default function Sidebars({ isOpen }: SidebarsProps) {
    const router = useRouter();
    const [profile, setProfile] = useState(false);

    useEffect(() => {
        if (profile) setProfile(false);
    }, [isOpen]);

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
        <section className={`${styles.container} ${isOpen ? styles.open : ""}`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                <section className={`${styles.logo} display_flex_center`}>
                    <figure>
                        <Image 
                        src={image_src.logo1}
                        alt="logo"
                        width={50}
                        height={50}
                        title="logo"
                        priority
                        />
                    </figure>
                </section>
                <section className={styles.options}>
                    <button>New Chat</button>
                </section>
                <section className={styles.chat_history}>
                    <select disabled>
                        <option>Your Documents</option>
                    </select>
                </section>
                <section className={styles.user_info}>
                    <figure className="display_flex_center" onClick={() => {setProfile(!profile);}}>
                        <img src={image_src.logo1} alt="User Pic" width={60} height={60}/>
                        <figcaption>Marc Giestin Louis Cordova</figcaption>
                    </figure>
                </section>
               
                <section className={`${styles.user_info_menu} display_flex_center ${profile ? styles.user_info_menu_open : ''}`}>
                    <figure className="display_flex_center">
                        <img src={image_src.logo1} alt="User Pic" width={60} height={60}/>
                        <div>
                            <figcaption>Marc Giestin Louis Cordova</figcaption>
                            <p>cordovamarcgiestinlouis@gmail.com</p>
                        </div>
                    </figure>
                    <button>Profile</button>
                    <button>Setting</button>
                    <button onClick={handle_logout}>Sign Out</button>
                </section>
               
            </div>
        </section>
    );
}

