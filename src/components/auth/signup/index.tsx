"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { ThreeDots } from "react-loader-spinner";
import { 
    useState 
} from "react";
import {
    Fetch_to,
    usePreventExit
} from "@/utilities";

export default function SignUp() {
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
        const responds = await Fetch_to("/services/mysql2/auth/signup/check_email", form);
        if (responds.success) {
            localStorage.setItem("signup_email", form.email);
        } else {
            setStatus(true);
            setMessage(responds.message || "Somethings Went Wrong");
        }
        setLoading(false);
    };

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className="wrapper display_flex_center">
                {loading ? (
                    <div className={`${styles.form_styles} display_flex_center`}>
                        <ThreeDots 
                        height={40}
                        width={40}
                        radius={9}
                        color="#4fa94d"
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
                            <h1>Sign up</h1>
                        </section>
                        <input 
                        type="text" 
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
                        <p>Already have an Account? <Link href={"/auth/signin"}>Sign In</Link></p>
                        <section className={`${styles.buttons} display_flex_right`}>
                            <button>Next</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}