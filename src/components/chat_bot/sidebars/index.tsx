"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useState } from "react";
import { Spiral as Hamburger } from "hamburger-react";
import { SweetAlert2, Fetch_to } from "@/utilities";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function Sidebars() {
    const router = useRouter();
    const [profile, setProfile] = useState(false);

    const handle_logout = async () => {

        const alert2 = await SweetAlert2("Signning Out", "Are you sure want to sign out?", "warning", true, "Yes", true, "No");

        if (alert2.isConfirmed) {
            SweetAlert2("Signning Out", "", "info", false, "", false, "", true);
            const response = await Fetch_to("/services/jwt/deauth");
            Swal.close();
            if (response.success) {   
                const alert2 = await SweetAlert2("Sign Out", "Complete", "success", true, "Go to Signin Page", false, "");
                if (alert2.isConfirmed) { router.push("/auth/signin"); }
            } else {
                SweetAlert2("Error", "Something went wrong", "error", true, "", false, "");
            }
            
        } 
    };

    return(
        <section className={styles.container}>
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
                    <Hamburger />
                </section>
                <section className={styles.options}>
                    <button>New Chat</button>
                </section>
                <section className={styles.chat_history}>
                    <select disabled>
                        <option>Yours Chats</option>
                    </select>
                </section>
                <section className={styles.user_info}>
                    <figure className="display_flex_center" onClick={() => {setProfile(!profile);}}>
                        <img src={image_src.logo1} alt="User Pic" width={60} height={60}/>
                        <figcaption>Marc Giestin Louis Cordova</figcaption>
                    </figure>
                </section>
                {profile && (
                    <section className={`${styles.user_info_menu} display_flex_center`}>
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
                )}
            </div>
        </section>
    );
}

