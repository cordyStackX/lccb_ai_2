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

export default function SignUp() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "", name: "", year: "", role: "", assign_by: ""
    });
    const [status, setStatus] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [ifMinors, setIfMinors] = useState(false);
    const [ifTeaher, setIfTeacher] = useState(false);

    usePreventExit(isDirty);

    useEffect(() => {
        if (form.role == "Student" && form.year == "Kinder Garten" ) {
            setIfMinors(true);
        } else if (form.role == "Student" && form.year == "Elementary") {
            setIfMinors(true);
        } else if (form.role == "Student" && form.year == "High School") {
            setIfMinors(true);
        } else {
            setIfMinors(false);
        }
        Progress(false);
        if (form.role == "Teacher") {
            setIfMinors(false);
            setIfTeacher(true);
        } else {
            setIfTeacher(false);
        }
    }, [form]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const responds = await Fetch_to(api_link.signup.checkEmail, { email: form.email, assign_by: form.assign_by, role: form.role, year: form.year });
        if (responds.success) {
            localStorage.setItem("email", form.email);
            localStorage.setItem("name", form.name);
            localStorage.setItem("year", form.year);
            localStorage.setItem("role", form.role);
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
                    <div className={`${styles.form_styles} `} style={{ flexFlow: "column" }}>
                        <React_Spinners status="Registering Your Account..."/>
                    </div>
                ) : (
                    <form className={styles.form_styles} onSubmit={handleSubmit}>
                        <section className={`${styles.info} `}>
                            <figure className={`${styles.logo} `}>
                                <Image 
                                src={image_src.logo1}
                                alt="Logo"
                                width={65}
                                height={65}
                                priority
                                />
                                <figcaption>LACO AI</figcaption>
                            </figure>
                        </section>
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
                        {ifMinors ? (
                            <input 
                            type="text" 
                            name="assign_by" 
                            id="assign_by" 
                            autoComplete="assign_by"
                            value={form.assign_by}
                            onChange={handleChange}
                            placeholder="Enter Your Teacher Email"
                            style={status ? {border: "2px solid var(--default-color-red)", color: "var(--default-color-red)"} : {}}
                            required
                            />
                        ) : null}
                        <select 
                        id="year"
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        required
                        >
                            <option value="">Select Year Level</option>
                            <option value="Kinder Garten">Kinder Garten</option>
                            <option value="Elementary">Elementary</option>
                            <option value="High School">High School</option>
                            <option value="Senior High School">Senior High School</option>
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
                        {ifMinors ? (
                            <p className="neutral">For Year of Kinder, Elementary, and High School you need to ask your Teacher Advisors Email</p>
                        ) : null}
                        {ifTeaher ? (
                            <p className="neutral">For Teacher{"'"}s you need to contact the admin to activate your account</p>
                        ) : null}
                        <section className={`${styles.buttons} `}>
                            <button>Register</button>
                        </section>
                        <p>Already have an Account? <Link href={"/auth/signin"} onClick={() => {Progress(true);}}>Sign In</Link></p>
                    </form>
                )}
            </div>
        </section>
    );
}