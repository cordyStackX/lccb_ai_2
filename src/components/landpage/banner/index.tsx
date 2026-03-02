"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";
import { useInView, Progress } from "@/utilities";

export default function Banner() {
    const router = useRouter();
    const { ref: title, isInView: titleIsInView } = useInView<HTMLDivElement>(true);
    const { ref: para, isInView: paraIsInView } = useInView<HTMLDivElement>(true);
    const { ref: spand, isInView: spandIsInView } = useInView<HTMLButtonElement>(true);

    return(
        <section className={`${styles.container}`}  >
            <div className={`${styles.wrapper}`}>
                <section className={`${styles.center}`}>
                    <h1
                    ref={title} style={{ '--fade-in' : titleIsInView ? 1 : 0 } as React.CSSProperties}
                    >
                    <span>LACO</span>
                    <span>Artificial</span> 
                    <span>Intelligence</span>
                    </h1>
                    <p 
                    ref={para} style={{ '--fade-in-p' : paraIsInView ? 1 : 0 } as React.CSSProperties}
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
                            <button onClick={() => {router.push("/auth/signup"); Progress(true);}} 
                            ref={spand} 
                            
                            style={{'--spand-in' : spandIsInView ? 1 : 0 } as React.CSSProperties} >Ask LACO</button>
                        </section>
                </section>
                <div className={styles.fx_effects}></div>
            </div>
        </section>
    );

}