"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";

export default function Banner() {
    const router = useRouter();

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                <section className={`${styles.center} display_flex_center`}>
                    <h1>LACO Artificial Intelligence</h1>
                    <p>LACO AI is an intelligent PDF summarization and analysis system enhanced by Gemini AI technologies.</p>
                        <section className={`${styles.buttons} display_flex_center`}>
                            <button onClick={() => {router.push("/auth/signup");}}>Ask LACO</button>
                        </section>
                </section>
                <div className={styles.fx_effects}></div>
            </div>
        </section>
    );

}