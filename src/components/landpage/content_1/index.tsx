"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import img_src from "@/config/images_links/assets.json";

export default function Content_1() {

    return(
        <section className={styles.container}>
            <div className={styles.wrapper}>
                <span className={styles.navi}><h3>AI Advantage</h3></span>
                <div className={styles.title}>
                    <h2>Empowering Learning Through AI with Smart Learning Assistance</h2>
                    <p>Integrating the OpenAI API, LACO AI provides accurate and contextual responses to your questions, 
                        assisting you in mastering your academic materials.</p>
                </div>
                <div className={styles.flexing}>
                    <div className={styles.contain}>
                        <span className={styles.logo}>
                            <Image 
                            src={img_src.security}
                            alt="Security"
                            width={50}
                            loading="eager"
                            height={50}
                            />
                        </span>
                        <span className={styles.f_title}>
                            <h3>Secure and User-Friendly</h3>
                            <p>LACO AI ensures a safe learning environment for students and administrators alike.</p>
                        </span>
                        <figure className={styles.image}>
                            <Image 
                            src={img_src.secure_ui}
                            alt="secure_ui"
                            loading="eager"
                            fill
                            />
                        </figure>
                    </div>
                    <div className={styles.contain}>
                        <span className={styles.logo}>
                            <Image 
                            src={img_src["google-docs"]}
                            alt="Security"
                            width={50}
                            height={50}
                            loading="eager"
                            />
                        </span>
                        <span className={styles.f_title}>
                            <h3>Effortless Document Analysis</h3>
                            <p>Easily upload your PDF documents and let LACO AI summarize and explain the content, making complex information easier to understand.</p>
                        </span>
                        <figure className={styles.image}>
                            <Image 
                            src={img_src.pdf_ui}
                            alt="secure_ui"
                            fill
                            loading="eager"
                            />
                        </figure>
                    </div>
                    <div className={styles.contain}>
                        <span className={styles.logo}>
                            <Image 
                            src={img_src.interactive}
                            alt="Security"
                            width={50}
                            height={50}
                            loading="eager"
                            />
                        </span>
                        <span className={styles.f_title}>
                            <h3>Interactive Learning Features</h3>
                            <p>Experience innovative features including voice and image input, 
                                allowing for a more engaging and interactive learning journey.</p>
                        </span>
                        <figure className={styles.image}>
                            <Image 
                            src={img_src.Interactions}
                            alt="secure_ui"
                            fill
                            loading="eager"
                            />
                        </figure>
                    </div>
                </div>
            </div>
        </section>
    );

}