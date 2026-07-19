"use client";
import styles from "./css/styles.module.scss";
import { useRouter } from "next/navigation";
import { useInView, Progress } from "@/utilities";
import Image from "next/image";
import img_src from "@/config/images_links/assets.json";

export default function Content_3() {
    const router = useRouter();
    const { ref: spand, isInView: spandIsInView } = useInView<HTMLButtonElement>(true);

    return(
        <section className={styles.container}>
            <div className={styles.wrapper}>
                <span className={styles.navi}><h3>AI Prompt</h3></span>
                <div className={styles.title}>
                    <h2>More Powerfull with <span style={{ color: "var(--secondary)"  }}>Prompting</span></h2>
                </div>
                <div className={styles.flexing}>
                   <figure>
                        <Image 
                        src={img_src.Prompting}
                        alt="Prompting"
                        width={1200}
                        height={200}
                        />
                   </figure>
                </div>
                <span className={styles.para}>
                    <p>
                        Enhance academic comprehension through 
                        AI-powered summarization and analysis, the acceptance 
                        testing phase could reveal varying levels of user engagement.
                    </p>
                </span>
                <section className={`${styles.buttons}`}>
                    <button onClick={() => {router.push("/auth/register"); Progress(true);}} 
                    ref={spand} 
                    
                    style={{'--spand-in' : spandIsInView ? 1 : 0 } as React.CSSProperties} >Ask LACO</button>
                </section>
                <div className={styles.fx_effects}></div>
            </div>
        </section>
    );

}