"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import img_src from "@/config/images_links/assets.json";

export default function Content_2() {

    return(
        <section className={styles.container}>
            <div className={styles.wrapper}>
                <span className={styles.title}>
                    <h2>Along with our School Department</h2>
                    <p>The Department of Information Technology at La Consolacion College Bacolod is 
                    dedicated to fostering an innovative and dynamic learning environment.</p>
                </span>
                <span className={styles.logos}>
                    <figure >
                        <Image 
                        src={img_src.logo1}
                        alt="lccb"
                        width={90}
                        height={90}
                        loading="eager"
                        />
                    </figure>
                    <figure >
                        <Image 
                        src={img_src.sbit}
                        alt="lccb"
                        width={90}
                        height={90}
                        loading="eager"
                        />
                    </figure>
                    <figure >
                        <Image 
                        src={img_src.council_removebg_preview}
                        alt="lccb"
                        width={90}
                        height={90}
                        loading="eager"
                        style={{ transform: "scale(1.3)" }}
                        />
                    </figure>
                </span>
            </div>
        </section>
    );

}