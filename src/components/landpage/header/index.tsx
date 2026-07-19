"use client";
import styles from "./css/styles.module.scss";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();
    return(
        <header className={styles.container}>
            <div className={styles.wrapper}>
                <figure className={`${styles.logo}`}>
                    <div>
                        <Image 
                        src={image_src.lccb}
                        alt="LCCB Logo"
                        className={styles.image1}
                        fill
                        />
                    </div>
                    <figcaption>
                        <h2>LACO AI</h2>
                    </figcaption>
                </figure>
                <section className={`${styles.buttons}`}>
                    <Link href="#FaQ">FaQ</Link>
                    <button onClick={() => {router.push("/auth/register");}}>Ask LACO</button>
                </section>
            </div>
        </header>
    );
}