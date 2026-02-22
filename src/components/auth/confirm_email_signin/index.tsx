"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import { Circles } from "react-loader-spinner";
import { useState, useEffect } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
} from "@/utilities";

export default function Confirm_email_signin() {
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
            setMessage("Code Send Successfully");
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
        if (responds.success) {
            localStorage.clear();
            await Fetch_to(api_link.jwt.auth, { email: form.email });
            if (form.email.endsWith("@admin.com")) return router.push("/admin/dashboard");
            router.push("/chat");
        } else {
            setMessage(responds.message);
            setStatus(true);
            setLoading(false);
        }
    };
    
    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className="wrapper display_flex_center">
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
                    <form className={styles.form_styles} onSubmit={ConfirmCode}>
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
                        <p>Didn{"'"}t Recieve? <a onClick={() => {SendCode(form.email);}}>Resend Code</a></p>
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button type="button" onClick={() => {router.back();}} style={{backgroundColor: "var(--secondary)"}}>Back</button>
                            <button>Confirm</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}