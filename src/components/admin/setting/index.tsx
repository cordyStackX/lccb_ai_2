"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to } from "@/utilities";

export default function Setting() {
    const router = useRouter();
    const [suspensionState, setSuspensionState] = useState("off");
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Fetch current suspension state
        const fetchSuspensionState = async () => {
            try {
                const response = await fetch(api_link.admin.get_suspension_state, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (response.ok) {
                    const data = await response.json();
                    setSuspensionState(data.state || "off");
                }
            } catch (e) {
                console.error("Failed to fetch suspension state:", e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchSuspensionState();
    }, []);
    
    const ChangePassword = async() => {
        localStorage.setItem("email", "admin@admin.com");
        const response = await Fetch_to(api_link.checkcode, { email: "admin@admin.com" });
        if (!response.success) return alert(response.message || "Something went wrong to the server find a developer to fix this problem");
        router.push("/auth/confirm-email-forgot-pwd");
    };

    const handleSuspensionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        setSuspensionState(newState);
        
        try {
            const response = await fetch(api_link.admin.set_suspension_state, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state: newState }),
            });
            
            if (!response.ok) {
                alert("Failed to update suspension state");
                setSuspensionState(suspensionState); // Revert on failure
            } else {
                alert(`API connections ${newState === "suspend" ? "suspended" : "restored"}`);
            }
        } catch (e) {
            console.error("Error updating suspension state:", e);
            alert("Error updating suspension state");
            setSuspensionState(suspensionState); // Revert on error
        }
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
                        <select value={suspensionState} onChange={handleSuspensionChange} disabled={loading}>
                            <option value="off">off</option>
                            <option value="suspend">suspend</option>
                        </select>
                    </div>
                    
                </div>
            </div>
        </section>
    );

}