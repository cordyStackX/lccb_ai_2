"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { Circles } from "react-loader-spinner";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit
} from "@/utilities";

export default function Create_Password() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", password: "", c_password: "", name: "", year: ""
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
         const checkCode = async () => {
            const saveEmail = localStorage.getItem("email");
            const saveName = localStorage.getItem("name");
            const saveYear = localStorage.getItem("year");
            const code = localStorage.getItem("code");
            const response = await Fetch_to(api_link.checkcode, { email: saveEmail, code: code });
            if (!response.success) return router.push("/auth/signin");
            setForm(prev => ({ ...prev, email: saveEmail || "", name: saveName || "", year: saveYear || ""}));
        };
        checkCode();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.signup.createAccount, form);
        if (responds.success) {
            localStorage.clear();
            router.push("/auth/signin");
        } else {
            setStatus(true);
            setLoading(false);
            setMessage(responds.message || "Somethings Went Wrong");
        }
    };

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                {loading ? (
                    <div className={`${styles.form_styles} display_flex_center`}>
                        <Circles
                        height="80"
                        width="80"
                        color="#1A54B8"
                        ariaLabel="circles-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
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
                         <span className={`display_flex_center ${styles.checkbox}`}>
                            <input type="checkbox" required />
                            <p>I agree to the <Link href={"/privacy"}>Privacy Policy</Link> & <Link href={"/terms"}>Terms of Conditions</Link></p>
                        </span>
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button type="button" onClick={() => {router.back();}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Create</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}