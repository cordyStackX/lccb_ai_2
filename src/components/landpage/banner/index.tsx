"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";
import { useInView, Progress } from "@/utilities";
import img_src from "@/config/images_links/assets.json";
import Image from "next/image";

export default function Banner() {
    const router = useRouter();
    const { ref: title, isInView: titleIsInView } = useInView<HTMLDivElement>(true);
    const { ref: para, isInView: paraIsInView } = useInView<HTMLDivElement>(true);
    const { ref: spand, isInView: spandIsInView } = useInView<HTMLButtonElement>(true);

    return(
        <section className={`${styles.container}`}  >
            <div className={`${styles.lights} ${styles.move1}`}></div>
            <div className={`${styles.lights} ${styles.move2}`}></div>
            <div className={`${styles.lights} ${styles.move3}`}></div>
            <div className={`${styles.lights} ${styles.move4}`}></div>
            <div className={`${styles.lights} ${styles.move5}`}></div>
            <div className={`${styles.lights} ${styles.move6}`}></div>
            <div className={`${styles.wrapper}`}>
                <section className={`${styles.center}`}>
                    <span className={styles.para}>
                        <p>Powered By Open AI</p>
                    </span>
                    <h1
                    ref={title} style={{ '--fade-in' : titleIsInView ? 1 : 0 } as React.CSSProperties}
                    >
                    <span>Empower</span>
                    <span>Your</span> 
                    <span>Education</span>
                    <span>with</span>
                    <span>LACO</span>
                    <span>AI</span>
                    </h1>
                    <p 
                    ref={para} style={{ '--fade-in-p' : paraIsInView ? 1 : 0, width: "70%" } as React.CSSProperties}
                    >
                    <span>LACO</span> 
                    <span>AI</span>
                    <span>is</span>
                    <span>an</span> 
                    <span>intelligent</span> 
                    <span>PDF</span> 
                    <span>summarization</span> 
                    <span>and</span>
                    <span>analysis</span> 
                    <span>system</span>
                    <span>enhanced</span>
                    <span>by</span>
                    <span>Open</span>
                    <span>AI</span> 
                    <span>technologies.</span>
                    </p>
                    <section className={`${styles.buttons}`}>
                        <button onClick={() => {router.push("/auth/register"); Progress(true);}} 
                        ref={spand} 
                        
                        style={{'--spand-in' : spandIsInView ? 1 : 0 } as React.CSSProperties} >Ask LACO</button>
                    </section>
                    <figure className={styles.img_limiter}>
                        <div>
                            <Image 
                            src={img_src.banner_fx_effect}
                            alt="banner_fx"
                            className={styles.bannerFx}
                            fill
                            loading="eager"
                            />
                        </div>
                    </figure>
                </section>
            </div>
        </section>
    );

}
