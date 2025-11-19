import styles from "./css/styles.module.css";
import image_src from "@/app/config/images_links/assets.json";
import Image from "next/image";

export default function Header() {
    return(
        <header className={styles.container}>
            <div className={`${styles.wrapper} display_flex_center`}>
                <section className={`${styles.logo} display_flex_left`}>
                    <Image 
                    src={image_src.logo1}
                    alt="LCCB Logo"
                    width={50}
                    height={50}
                    className={styles.image1}
                    unoptimized
                    />
                    <Image 
                    src={image_src.logo2}
                    alt="LCCB Logo"
                    width={50}
                    height={50}
                    className={styles.image2}
                    unoptimized
                    />
                </section>
                <section className={`${styles.buttons} display_flex_right`}>
                    <button>Ask AI</button>
                </section>
            </div>
        </header>
    );
}