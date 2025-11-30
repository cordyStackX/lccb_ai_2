"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { ThreeDots } from "react-loader-spinner";
import { useState, useEffect } from "react";
import {
    Fetch_to,
    usePreventExit
} from "@/utilities";

export default function Create_Password() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", password: "", c_password: ""
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

     useEffect(() => {
        const saveEmail = localStorage.getItem("signup_email");
        setForm(prev => ({ ...prev, email: saveEmail || "" }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to("/services/mysql2/auth/signup/create_password", form);
        if (responds.success) {
            localStorage.clear();
            router.push("/auth/signin");
        } else {
            setStatus(true);
            setLoading(false);
            setMessage(responds.message || "Somethings Went Wrong");
            // router.push("/auth/signin");
        }
    };

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className="wrapper display_flex_center">
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
                        <section className={`${styles.info} display_flex_left`}>
                            <figure className={`${styles.logo} display_flex_left`}>
                                <Image 
                                src={image_src.logo1}
                                alt="Logo"
                                width={65}
                                height={65}
                                priority
                                />
                                <figcaption>LACO AI</figcaption>
                            </figure>
                            <h1>Create your password</h1>
                        </section>
                        <input 
                        type="password" 
                        name="password" 
                        id="password" 
                        autoComplete="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Create your password"
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        <input 
                        type="password" 
                        name="c_password" 
                        id="c_password" 
                        autoComplete="password"
                        value={form.c_password}
                        onChange={handleChange}
                        placeholder="Confirm Your Password"
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <p>Can{"'"}t create an account? <Link href={"/"}>Contact Us</Link></p>
                        <section className={`${styles.buttons} display_flex_right`}>
                            <button type="button" onClick={() => {router.back();}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Create</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}