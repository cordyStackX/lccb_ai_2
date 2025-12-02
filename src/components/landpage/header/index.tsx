"use client";
import styles from "./css/styles.module.css";
import image_src from "@/config/images_links/assets.json";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();
    return(
        <header className={styles.container}>
            <div className="wrapper display_flex_center">
                <figure className={`${styles.logo} display_flex_center`}>
                    <Image 
                    src={image_src.logo1}
                    alt="LCCB Logo"
                    width={70}
                    height={70}
                    className={styles.image1}
                    />
                </figure>
                <section className={`${styles.title} display_flex_center`}>
                    <h2>LACO AI</h2>
                </section>
                <section className={`${styles.buttons} display_flex_center`}>
                    <button onClick={() => {router.push("/auth/signup");}}>Ask LACO</button>
                </section>
            </div>
        </header>
    );
}