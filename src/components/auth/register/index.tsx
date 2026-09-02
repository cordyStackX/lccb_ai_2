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
import { Turnstile } from "@marsidev/react-turnstile";

export default function SignUp() {
    const router = useRouter();
    const [turnstileToken, setTurnstileToken] = useState("");
    const [form, setForm] = useState({
        id: "", email: "", name: "", year: "", role: "", assign_by: "", department: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [ifNotMinors, setIfNotMinors] = useState(false);

    usePreventExit(isDirty);

    useEffect(() => {
        Progress(false);
        if (form.year === "College") {
            setIfNotMinors(true);
        } else {
            setIfNotMinors(false);
        }
    }, [form]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.signup.checkEmail, { email: form.email, assign_by: form.assign_by, role: form.role, year: form.year, turnstileToken });
        if (responds.success) {
            localStorage.setItem("id", form.id);
            localStorage.setItem("email", form.email);
            localStorage.setItem("name", form.name);
            localStorage.setItem("year", form.year);
            localStorage.setItem("role", form.role);
            localStorage.setItem("department", form.department);
            localStorage.setItem("assign_by", form.assign_by);
            const responds = await Fetch_to(api_link.checkcode, { email: form.email, key: "register" });
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
        <section className={`${styles.container} `}>
            <div className={`${styles.wrapper} `}>
                {loading ? (
                    <div style={{ height: "100dvh" }}>
                        <React_Spinners status="Registering Your Account..."/>
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
                            <h1>LCCB Account Registration</h1>
                            <p>Please Register to continue</p>
                        </div>

                        <div className={styles.input_holder}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                                    <circle cx="8" cy="10" r="2"/>
                                    <path d="M13 9h5"/>
                                    <path d="M13 13h5"/>
                                    <path d="M6 16h12"/>
                                </svg>
                            </span>
                            <input 
                            type="number" 
                            name="id" 
                            id="id" 
                            autoComplete="id"
                            value={form.id}
                            onChange={handleChange}
                            placeholder="School Id"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
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
                        <div className={styles.input_holder}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M6 16c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M13 9h5M13 12h5M13 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            autoComplete="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Full Name"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                        </div>
                        
                        <div className={styles.input_holder}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 9l10-4 10 4-10 4-10-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M22 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <select 
                            id="year"
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            >
                                <option value="">Select Year Level</option>
                                <option value="Kinder Garten">Kinder Garten</option>
                                <option value="Elementary">Elementary</option>
                                <option value="High School">High School</option>
                                <option value="Senior High School">Senior High School</option>
                                <option value="College">College</option>
                            </select>
                        </div>
                        
                        <div className={styles.input_holder}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                                <path d="M4 20c0-3.3 3-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M16 8h5M18.5 5.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <select 
                            id="role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            >
                                <option value="">Select Your Role</option>
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                            </select>
                        </div>
                        
                        <div className={styles.input_holder}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M5 21V9l7-4 7 4v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M9 21v-5h6v5" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M9 11h.01M15 11h.01M9 14h.01M15 14h.01"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <select 
                            id="department"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            >
                                <option value="">Select Your Department</option>
                                
                                {ifNotMinors ? null : (
                                    <option value="IBED">Integrated Basic Education Department</option>
                                )}

                                {ifNotMinors ? (
                                    <>
                                        <option value="SARFAID">School of Architecture, Fine Arts & Interior Design</option>
                                        <option value="SBIT">School of Business & Information Technology</option>
                                        <option value="SHTM">School of Hospitality & Tourism Management</option>
                                        <option value="SSLATE">School of Sciences, Liberal Arts & Teacher Education</option>
                                    </>
                                ) : null}
                            </select>
                        </div>
                        
                        <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                            onSuccess={(token) => setTurnstileToken(token)}
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <section className={`${styles.buttons} `}>
                            <button>Register</button>
                        </section>
                        <p>Already have an Account? <Link href={"/auth/signin"} onClick={() => {Progress(true);}}>Sign In an Account</Link></p>
                        <p style={{ textAlign: "center" }}>Register Business Account? <Link href={"/auth/register_business"} onClick={() => {Progress(true);}}>Registered Business Account </Link></p>
                    </form>
                )}
            </div>
        </section>
    );
}