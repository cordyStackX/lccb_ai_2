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
        email: "", password: "", role: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            localStorage.setItem("role", status.data.message);
            const responds = await Fetch_to(api_link.checkcode, { email: form.email });
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
                            <h1>Login</h1>
                            <p>Please Sign in to continue</p>
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
                       
                        <div className={styles.password_field}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="11" width="14" height="10" rx="2" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                <circle cx={12} cy={16} r={1} />
                                <path d="M12 17v2" />
                                </svg>
                            </span>
                            <input 
                            type={showPassword ? "text" : "password"}
                            name="password" 
                            id="password" 
                            autoComplete="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Password"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                            <button
                                type="button"
                                className={styles.password_toggle}
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <span className={`${styles.checkbox} `}>
                            <input type="checkbox" required />
                            <p>I agree to the <Link href={"/privacy"} onClick={() => {Progress(true);}}>Privacy Policy</Link> & <Link href={"/terms"} onClick={() => {Progress(true);}} >Terms of Conditions</Link></p>
                        </span>
                       
                        <section className={`${styles.buttons}`}>
                            <button>Log In</button>
                        </section>
                       
                        <p>Register an Account? <Link href={"/auth/register"} onClick={() => {Progress(true);}}>Register Account</Link></p>
                        <p>Register Business Account? <Link href={"/auth/register_business"} onClick={() => {Progress(true);}}>Register Business Account </Link></p>
                        <p><Link href={"/auth/forgot-password"} onClick={() => {Progress(true);}}>Forgot Password?</Link></p>
                        
                    </form>
                )}
            </div>
        </section>
    );
}