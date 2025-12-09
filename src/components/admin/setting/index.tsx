"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to } from "@/utilities";

export default function Setting() {
    const router = useRouter();
    
    const ChangePassword = async() => {
        localStorage.setItem("email", "admin@admin.com");
        const response = await Fetch_to(api_link.checkcode, { email: "admin@admin.com" });
        if (!response.success) return alert(response.message || "Something went wrong to the server find a developer to fix this problem");
        router.push("/auth/confirm-email-forgot-pwd");
    };


    return(
        <section className={styles.container}>
            <div className={`${styles.wrapper}`}>
                <h2>System Settings</h2>
                
                <div className={styles.settings}>
                    <h3>General Setting</h3>
                    <div className={`${styles.update_password} display_flex_center`}>
                        <p>Change the admin password</p>
                        <button onClick={ChangePassword}>Change</button>
                    </div>
                    <h3>Emergency Suspensions</h3>
                    <div className={`${styles.setting_set} display_flex_center`}>
                        <p>Suspend all API connections</p> 
                        <select>
                            <option value="off">off</option>
                            <option value="suspend">suspend</option>
                        </select>
                    </div>
                    
                </div>
            </div>
        </section>
    );

}