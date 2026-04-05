"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit,
    React_Spinners,
    Progress
} from "@/utilities";

export default function Forgot_password() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    usePreventExit(isDirty);

    useEffect(() => {
        Progress(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.fotgot_password.checkEmail, { email: form.email });
        if (responds.success) {
            localStorage.setItem("email", form.email);
           const responds = await Fetch_to(api_link.checkcode, { email: form.email, key: "forgot_password" });
            if(!responds.success) {
                setMessage(responds.message || "Somethings Went Wrong");
                setLoading(false); 
                setStatus(true);
                return;
            }
            router.push("/auth/confirm-email-forgot-pwd");
        } else {
            setStatus(true);
            setMessage(responds.message || "Somethings Went Wrong");
            setLoading(false);
        }
    };

    return(
        <section className={`${styles.container} `}>
            <div className={`${styles.wrapper} `}>
                {loading ? (
                    <div className={`${styles.form_styles} `}>
                        <React_Spinners status="Comfirming Your Email..." />
                    </div>
                ) : (
                    <form className={styles.form_styles} onSubmit={handleSubmit}>
                        <section className={`${styles.info} `}>
                            <figure className={`${styles.logo} `}>
                                <Image 
                                src={image_src.logo1}
                                alt="Logo"
                                width={65}
                                height={65}
                                priority
                                />
                                <figcaption>LACO AI</figcaption>
                            </figure>
                            <h1>Forgot Password</h1>
                        </section>
                        <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter Your Email"
                        style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                       
                        <section className={`${styles.buttons} `}>
                            <button type="button" onClick={() => {router.back(); Progress(true);}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Next</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}