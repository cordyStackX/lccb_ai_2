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
    useConfirmExit
} from "@/utilities";


export default function Create_Password() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", password: "", c_password: "", name: "", year: "", role: "", id: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    usePreventExit(true);

    const confirmExit = useConfirmExit({
        onConfirm: () => router.push("/auth/register")
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

     useEffect(() => {
         const checkCode = async () => {
            const saveEmail = localStorage.getItem("email");
            const saveName = localStorage.getItem("name");
            const saveYear = localStorage.getItem("year");
            const saveRole = localStorage.getItem("role");
            const saveId = localStorage.getItem("id");
            setForm(prev => ({ ...prev, email: saveEmail || "", name: saveName || "", year: saveYear || "", role: saveRole || "", id: saveId || "" }));
        };
        checkCode();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (form.role === "Business") {
            
            const responds = await Fetch_to(api_link.business.signup.createAccount, form);
            if (responds.success) {
                const autosignin_response = await Fetch_to(api_link.signin, {email: form.email, password: form.password});
                if (autosignin_response.success) {
                    localStorage.clear();
                    
                    await Fetch_to(api_link.jwt.auth, { email: form.email });
                    router.push("/admin_business/dashboard");
                } else {
                    alert(responds.message);
                    router.push("/auth/signin");
                }
            } else {
                setStatus(true);
                setLoading(false);
                setMessage(responds.message || "Somethings Went Wrong");
            }
            return;
        }

        const responds = await Fetch_to(api_link.signup.createAccount, form);
        if (responds.success) {
            const autosignin_response = await Fetch_to(api_link.signin, {email: form.email, password: form.password});

            if (autosignin_response.success) {
                localStorage.clear();
                
                await Fetch_to(api_link.jwt.auth, { email: form.email });
                router.push("/chat");
            } else {
                alert(responds.message);
                router.push("/auth/signin");
            }

        } else {
            setStatus(true);
            setLoading(false);
            setMessage(responds.message || "Somethings Went Wrong");
        }
    };

    return(
        <section className={`${styles.container} `}>
            <div className={`${styles.wrapper} `}>
                {loading ? (
                    <div className={`${styles.form_styles} `}>
                        <React_Spinners status="Activating Your Account..." />
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
                            <h1>Create your password</h1>
                        </section>
                        <div className={styles.password_field}>
                            <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            id="password" 
                            autoComplete="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Create your password"
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
                        <div className={styles.password_field}>
                            <input 
                            type={showPassword2 ? "text" : "password"} 
                            name="c_password" 
                            id="c_password" 
                            autoComplete="password"
                            value={form.c_password}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                            <button
                                type="button"
                                className={styles.password_toggle}
                                aria-pressed={showPassword2}
                                onClick={() => setShowPassword2((prev) => !prev)}
                            >
                                {showPassword2 ? "Hide" : "Show"}
                            </button>
                        </div>
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                         <span className={styles.checkbox}>
                            <input type="checkbox" required />
                            <p>I agree to the <Link href={"/privacy"}>Privacy Policy</Link> & <Link href={"/terms"}>Terms of Conditions</Link></p>
                        </span>
                        <section className={`${styles.buttons} `}>
                            <button type="button" onClick={() => { if(confirmExit()) return router.push("/auth/signin");  }} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Register</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}