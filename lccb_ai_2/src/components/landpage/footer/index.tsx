 "use client";
import styles from "./css/styles.module.scss";


export default function Footer() {
    return(
        <footer className={styles.container}>
            <div className={styles.fx_effects} />
            <div className={styles.wrapper}>
                <div className={styles.brand}>
                    <h2>LACO AI</h2>
                    <p>AI-powered learning support for secure and efficient document analysis.</p>
                </div>

                <div className={styles.links}>
                    <h3>Quick Links</h3>
                    <a href="#top">Back to top</a>
                    <a href="/auth/register">Get Started</a>
                    <a href="/chat">Open Chat</a>
                </div>

                <div className={styles.links}>
                    <h3>Contact</h3>
                    <a href={process.env.NEXT_PUBLIC_GMAIL_USERNAME}>{process.env.NEXT_PUBLIC_GMAIL_USERNAME}</a>
                    <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noreferrer">
                        GitHub Repository
                    </a>
                </div>
            </div>

            <div className={styles.bottom}>
                <span>© 2026 LACO AI. All rights reserved.</span>
                <span>Built for secure student learning.</span>
            </div>
        </footer>
    );
}
