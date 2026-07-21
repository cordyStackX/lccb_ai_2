"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState } from "react";
import { Fetch_to, Popup_info } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

type Embeded_codeProps = {
    email: string;
}

export default function Embeded_code({ email } : Embeded_codeProps) {
    const [origin, setOrigin] = useState("");
    const [width, setWidth] = useState("400");
    const [height, setHeight] = useState("600");
    const [copied, setCopied] = useState(false);
    const [chatbot_info, setChatbot_info] = useState({
        name: "", instruction: "", body: ""
    });
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");
    const [iframeKey, setIframeKey] = useState(0);

    const refreshIframe = () => {
        setIframeKey((prev) => prev + 1);
    };

    useEffect(() => {
        // window is only available client-side, hence "use client" + useEffect
        setOrigin(window.location.origin);
        async function Chatbot() {
            const response = await Fetch_to(api_link.chatbot_public);
            const result = response.data.message[0];
            if (response.success) {
                setChatbot_info(prev => ({ ...prev, name: result.name, instruction: result.instruction, body: result.body }));
            }
        }
        Chatbot();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setChatbot_info({ ...chatbot_info, [e.target.name]: e.target.value });
    };

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

    const handleSave = async () => {

        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Updating Please Wait...");

        const response = await Fetch_to(api_link.admin.update_chatbot, {
            name: chatbot_info.name,
            instruction: chatbot_info.instruction,
            body: chatbot_info.body,
            email: email
        });

        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            refreshIframe();
        } else {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
            alert(response.message);
        }

    };

    return (
        <section className={styles.container}>
            {isLoadState ? (
                isLoadStateDone ? (
                    <Popup_info status={isLoadStatus} bg_color="var(--primary)" states={true} load={true} error={false} />
                ) : (
                    isLoadError ? (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-red)" states={false} load={true} error={true} />
                    ) : (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-green)" states={false} load={true} error={false} />
                    )
                )
                
             ) : null}
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

                <div className={styles.detailsRow}>
                    <label className={styles.detailsField}>
                        <span>AI Name</span>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={chatbot_info.name}
                            onChange={handleChange}
                            placeholder="e.g. LACO"
                            maxLength={20}
                        />
                    </label>
                    <label className={styles.detailsField}>
                        <span>Instructions</span>
                        <input
                            type="text"
                            id="instruction"
                            name="instruction"
                            value={chatbot_info.instruction}
                            onChange={handleChange}
                            placeholder="Short instruction summary"
                            maxLength={50}
                        />
                    </label>
                    <label className={`${styles.detailsField} ${styles.detailsFieldWide}`}>
                        <span>Instruction Body</span>
                        <textarea
                            name="body"
                            value={chatbot_info.body}
                            onChange={handleChange}
                            placeholder="Full instruction body"
                            rows={3}
                            maxLength={100}
                        />
                    </label>
                    <button className={styles.saveInfoButton} onClick={handleSave} >Save</button>
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
                            key={iframeKey}
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