"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit,
    React_Spinners,
    Progress
} from "@/utilities";


export default function SignUpBusiness() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", name: "", year: "", role: "Business", assign_by: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    usePreventExit(isDirty);

    useEffect(() => {
        Progress(false);
    }, [form]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.business.signup.checkEmail, { email: form.email, assign_by: form.assign_by, role: form.role, year: form.year });
        if (responds.success) {
            localStorage.setItem("email", form.email);
            localStorage.setItem("name", form.name);
            localStorage.setItem("year", form.year);
            localStorage.setItem("role", form.role);
            localStorage.setItem("assign_by", form.assign_by);
            const responds = await Fetch_to(api_link.checkcode, { email: form.email, key: "register" });
            if(!responds.success) {
                setMessage(responds.message || "Somethings Went Wrong");
                setLoading(false); 
                setStatus(true);
                return;
            }
            router.push("/auth/confirm-email-signup");
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
                    <div style={{ height: "100dvh" }}>
                        <React_Spinners status="Registering Your Account..."/>
                    </div>
                ) : (
                    <form className={styles.form_styles} onSubmit={handleSubmit}>
                        <section className={`${styles.info} `}>
                            <figure className={`${styles.logo} `}>
                                <Image 
                                src={image_src.lccb}
                                alt="Logo"
                                width={65}
                                height={65}
                                priority
                                />
                                <figcaption>LACO AI</figcaption>
                            </figure>
                        </section>
                        <div className={styles.text_contain}>
                            <h1>Business Registration </h1>
                            <p>Please Register to continue</p>
                        </div>
                        
                        <div className={styles.input_holder}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="5" width="18" height="14" rx="2"/>
                                <path d="M3 7l9 6 9-6"/>
                                </svg>
                            </span>
                            <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Email"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                        </div>
                        <div className={styles.input_holder}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M6 16c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M13 9h5M13 12h5M13 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            autoComplete="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Business Name"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                        </div>
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <section className={`${styles.buttons} `}>
                            <button>Register</button>
                        </section>
                        <p >Already have an Account? <Link href={"/auth/signin"} onClick={() => {Progress(true);}}>Sign In an Account</Link></p>
                    </form>
                )}
            </div>
        </section>
    );
}