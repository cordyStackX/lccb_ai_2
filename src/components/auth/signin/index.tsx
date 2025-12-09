"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { ThreeDots } from "react-loader-spinner";
import { useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit
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
            await Fetch_to(api_link.checkcode, { email: form.email });
            router.push("/auth/confirm-email-signin");
        } else {
            setStatus(true);
            setMessage(responds.message || "Somethings Went Wrong");
            setLoading(false);
        }
    };

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                {loading ? (
                    <div className={`${styles.form_styles} display_flex_center`}>
                        <ThreeDots 
                        height={90}
                        width={90}
                        radius={9}
                        color="var(--adaptive-color-2)"
                        ariaLabel="three-dots-loading"
                        visible={true}
                        />
                    </div>
                ) : (
                    <form className={styles.form_styles} onSubmit={handleSubmit}>
                        <section className={`${styles.info} display_flex_center`}>
                            <figure className={`${styles.logo} display_flex_center`}>
                                <Image 
                                src={image_src.logo1}
                                alt="Logo"
                                width={65}
                                height={65}
                                priority
                                />
                                <figcaption>LACO AI</figcaption>
                            </figure>
                            <h1>Sign in</h1>
                        </section>
                        <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
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
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <p>Create an Account? <Link href={"/auth/signup"}>Sign Up</Link></p>
                        <p><Link href={"/auth/forgot-password"}>Forgot Password?</Link></p>
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button>Sign In</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}