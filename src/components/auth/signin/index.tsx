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

export default function SignIn() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", password: ""
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
        const status = await Fetch_to(api_link.check_status, { email: form.email });

        if (!status.success) {
            setMessage(status.message || "Somethings Went Wrong");
            setLoading(false); 
            setStatus(true);
            return;
        }

        const responds = await Fetch_to(api_link.signin, form);
        if (responds.success) {
            localStorage.setItem("email", form.email);
            const responds = await Fetch_to(api_link.checkcode, { email: form.email, key: "signin" });
            if(!responds.success) {
                setMessage(responds.message || "Somethings Went Wrong");
                setLoading(false); 
                setStatus(true);
                return;
            }
            router.push("/auth/confirm-email-signin");
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
                    <div className={`${styles.form_styles}`} style={{ flexFlow: "column" }}>
                       <React_Spinners status="Signing in..." />
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
                        </section>
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
                         <input 
                        type="password" 
                        name="password" 
                        id="password" 
                        autoComplete="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password"
                        style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <span className={`${styles.checkbox} `}>
                            <input type="checkbox" required />
                            <p>I agree to the <Link href={"/privacy"} onClick={() => {Progress(true);}}>Privacy Policy</Link> & <Link href={"/terms"} onClick={() => {Progress(true);}} >Terms of Conditions</Link></p>
                        </span>
                       
                        <section className={`${styles.buttons} `}>
                            <button>Log In</button>
                        </section>
                        <p>Register an Account? <Link href={"/auth/signup"} onClick={() => {Progress(true);}}>Registered</Link></p>
                        <p><Link href={"/auth/forgot-password"} onClick={() => {Progress(true);}}>Forgot Password?</Link></p>
                    </form>
                )}
            </div>
        </section>
    );
}