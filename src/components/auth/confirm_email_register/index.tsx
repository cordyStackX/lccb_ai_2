"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    React_Spinners
} from "@/utilities";

export default function Confirm_email_signup() {
    const router = useRouter();

    const [form, setForm] = useState({
        code: "", email: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const saveEmail = localStorage.getItem("email");
        setForm(prev => ({ ...prev, email: saveEmail || "" }));
    }, []);

    const SendCode = async (e: string | null) => {
        setLoading(true);
        const responds = await Fetch_to(api_link.checkcode, { email: e });
        if (responds.success) {
            setStatus(false);
            setMessage("Code sent successfully. Expires in 3 minutes.");
            setLoading(false);
        } else {
            setStatus(true);
            setLoading(false);
            setMessage(responds.message || "Something went wrong");
        }
    };

    const ConfirmCode = async () => {
        setLoading(true);
        const responds = await Fetch_to(api_link.checkcode, { email: form.email, code: form.code });
        localStorage.setItem("code", form.code);
        if (responds.success) {
            router.push("/auth/create-password");
        } else {
            setMessage(responds.message);
            setStatus(true);
            setLoading(false);
        }
    };
    

    return(
        <section className={`${styles.container} `}>
            <div className={`${styles.wrapper} `}>
                {loading ? (
                    <div className={`${styles.form_styles} `}>
                        <React_Spinners status="Confirming Auth..." />
                    </div>
                ) : (
                    <form className={styles.form_styles} onSubmit={ConfirmCode}>
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
                            <h2>Check your email</h2>
                        </section>
                        <input 
                        type="number" 
                        name="code" 
                        id="code" 
                        autoComplete="code"
                        onChange={handleChange}
                        placeholder="Enter Code"
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <p>Didn{"'"}t Recieve? <a onClick={() => {SendCode(form.email);}} style={{ cursor: "pointer" }}>Resend Code</a></p>
                        <section className={`${styles.buttons} `}>
                            <button type="button" onClick={() => {router.back();}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Confirm</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}