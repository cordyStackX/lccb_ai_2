"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import { Circles } from "react-loader-spinner";
import { useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import {
    Fetch_to,
    usePreventExit
} from "@/utilities";

export default function SignUp() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", name: "", year: "", role: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    usePreventExit(isDirty);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.signup.checkEmail, { email: form.email });
        if (responds.success) {
            localStorage.setItem("email", form.email);
            localStorage.setItem("name", form.name);
            localStorage.setItem("year", form.year);
            localStorage.setItem("role", form.role);
            const responds = await Fetch_to(api_link.checkcode, { email: form.email });
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
                            <h1>Sign up</h1>
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
                        <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter Your Full Name"
                        style={status ? {borderBottom: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                        required
                        />
                        <select 
                        id="year"
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        required
                        >
                            <option value="">Select Year Level</option>
                            <option value="Kinder Garden">Kinder Garden</option>
                            <option value="Elementary">Elementary</option>
                            <option value="High School">High School</option>
                            <option value="Senior High Scool">Senior High School</option>
                            <option value="College">College</option>
                        </select>

                        <select 
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        required
                        >
                            <option value="">Select Your Role</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                        </select>
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <p>Already have an Account? <Link href={"/auth/signin"}>Sign In</Link></p>
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button>Next</button>
                        </section>
                    </form>
                )}
            </div>
        </section>
    );
}