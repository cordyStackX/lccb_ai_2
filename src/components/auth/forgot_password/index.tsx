"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import { Circles } from "react-loader-spinner";
import { useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit
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
           const responds = await Fetch_to(api_link.checkcode, { email: form.email });
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
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                       
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button type="button" onClick={() => {router.back();}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Next</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}