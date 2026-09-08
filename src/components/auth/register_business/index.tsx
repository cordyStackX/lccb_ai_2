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


export default function SignUpBusiness() {
    const router = useRouter();
    const [turnstileToken, setTurnstileToken] = useState("");
    const [form, setForm] = useState({
        email: "", name: "", year: "", business_name: "", role: "Business", assign_by: "", institutions: "", specify_institutions: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showOthers, setShowOthers] = useState(false);

    usePreventExit(isDirty);

    useEffect(() => {
        Progress(false);

        if (form.institutions === "Others (specify)") {
          setShowOthers(true);
        } else {
          setShowOthers(false);
        }

    }, [form]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.business.signup.checkEmail, { email: form.email, assign_by: form.assign_by, role: form.role, year: form.year, turnstileToken });
        if (responds.success) {
            localStorage.setItem("email", form.email);
            localStorage.setItem("name", form.name);
            localStorage.setItem("year", form.year);
            localStorage.setItem("role", form.role);
            localStorage.setItem("assign_by", form.assign_by);
            localStorage.setItem("business_name", form.business_name);
            localStorage.setItem("institutions", showOthers ? form.specify_institutions : form.institutions);
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
                            <h1>Business Registration </h1>
                            <p>Please Register to continue</p>
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
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M6 16c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M13 9h5M13 12h5M13 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <input 
                            type="text" 
                            name="business_name" 
                            id="business_name" 
                            autoComplete="business_name"
                            value={form.business_name}
                            onChange={handleChange}
                            placeholder="Business Name"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
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
                            id="institutions"
                            name="institutions"
                            value={form.institutions}
                            onChange={handleChange}
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            >
                                <option value="">Select Your Institutions</option>
                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Corporation (Stock)">Corporation (Stock)</option>
                                <option value="Corporation (Non-Stock)">Corporation (Non-Stock)</option>
                                <option value="One Person Corporation (OPC)">One Person Corporation (OPC)</option>
                                <option value="Cooperative">Cooperative</option>
                                <option value="Non-Governmental Organization (NGO)">Non-Governmental Organization (NGO)</option>
                                <option value="Government Agency / Government-Owned or Controlled Corporation (GOCC)">Government Agency / Government-Owned or Controlled Corporation (GOCC)</option>
                                <option value="Foundation">Foundation</option>
                                <option value="Association">Association</option>
                                <option value="Foreign-Owned Enterprise / Branch Office">Foreign-Owned Enterprise / Branch Office</option>
                                <option value="Representative Office">Representative Office</option>
                                <option value="Regional Headquarters (RHQ) / Regional Operating Headquarters (ROHQ)">Regional Headquarters (RHQ) / Regional Operating Headquarters (ROHQ)</option>
                                <option value="Joint Venture">Joint Venture</option>
                                <option value="Micro, Small, and Medium Enterprise (MSME)">Micro, Small, and Medium Enterprise (MSME)</option>
                                <option value="Educational Institution (Private)">Educational Institution (Private)</option>
                                <option value="Educational Institution (Public/State)">Educational Institution (Public/State)</option>
                                <option value="Religious Organization">Religious Organization</option>
                                <option value="Others (specify)">Others (specify)</option>
                            </select>
                        </div>

                        {showOthers ? (
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
                            <input 
                            type="text" 
                            name="specify_institutions" 
                            id="specify_institutions" 
                            autoComplete="specify_institutions"
                            value={form.specify_institutions}
                            onChange={handleChange}
                            placeholder="What Institutions"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                        </div>
                        ) : null}

                        <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                            onSuccess={(token) => setTurnstileToken(token)}
                            options={{ theme: "light" }}
                        />
                        {message && (
                            <p className={status ?  "error" : "success"}>{message}</p>
                        )}
                        <section className={`${styles.buttons} `}>
                            <button>Register</button>
                        </section>
                        <p >Already have an Account? <Link href={"/auth/signin"} onClick={() => {Progress(true);}}>Sign In an Account</Link></p>
                        <p style={{ textAlign: "center" }}>Register an LCC Account? <Link href={"/auth/register"} onClick={() => {Progress(true);}}>Registered LCC Account</Link></p>
                    </form>
                )}
            </div>
        </section>
    );
}