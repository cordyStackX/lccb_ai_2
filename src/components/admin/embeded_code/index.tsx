"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState } from "react";

export default function Embeded_code() {
    const [origin, setOrigin] = useState("");
    const [width, setWidth] = useState("400");
    const [height, setHeight] = useState("600");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // window is only available client-side, hence "use client" + useEffect
        setOrigin(window.location.origin);
    }, []);

    const embedUrl = `${origin}/chat_bot`;

    const snippet = `<iframe
    src="${embedUrl}"
    width="${width}"
    height="${height}"
    style="border: none; border-radius: 12px;"
    title="Chatbot"
    allow="clipboard-write"
></iframe>`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Copy failed:", e);
        }
    };

    return (
        <section className={styles.container}>
            <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 6L22 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.5 4L10.5 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h1>Embed Code</h1>
                </span>
            </header>

            <div className={styles.status}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitleGroup}>
                        <h2>Chatbot Widget</h2>
                    </span>
                </div>
                <p className={styles.sectionDescription}>
                    Copy this snippet and paste it into any HTML page to embed the chatbot
                </p>

                <div className={styles.sizeRow}>
                    <label className={styles.sizeField}>
                        <span>Width (px)</span>
                        <input
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            min={200}
                        />
                    </label>
                    <label className={styles.sizeField}>
                        <span>Height (px)</span>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            min={300}
                        />
                    </label>
                </div>

                <div className={styles.codeBlockWrapper}>
                    <div className={styles.codeBlockHeader}>
                        <span>HTML</span>
                        <button className={styles.copyButton} onClick={handleCopy}>
                            {copied ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Copied
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <pre className={styles.codeBlock}>
                        <code>{snippet}</code>
                    </pre>
                </div>

                <h3 className={styles.sectionLabel}>Live Preview</h3>
                <div className={styles.previewShell}>
                    {origin ? (
                        <iframe
                            src={embedUrl}
                            width={width}
                            height={height}
                            style={{ border: "none", borderRadius: "12px", maxWidth: "100%" }}
                            title="Chatbot preview"
                        />
                    ) : (
                        <span className={`${styles.skeletonBar} ${styles.skeletonPreview}`} />
                    )}
                </div>
            </div>
        </section>
    );
}