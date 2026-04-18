"use client";
import styles from "./css/styles.module.css";
import image_src from "@/config/images_links/assets.json";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();
    return(
        <header className={styles.container}>
            <div className={styles.wrapper}>
                <figure className={`${styles.logo}`}>
                    <Image 
                    src={image_src.lccb}
                    alt="LCCB Logo"
                    width={65}
                    height={65}
                    className={styles.image1}
                    />
                </figure>
                <section className={`${styles.title}`}>
                    <h2>LACO AI</h2>
                </section>
                <section className={`${styles.buttons}`}>
                    <button onClick={() => {router.push("/auth/register");}}>Ask LACO</button>
                </section>
            </div>
        </header>
    );
}