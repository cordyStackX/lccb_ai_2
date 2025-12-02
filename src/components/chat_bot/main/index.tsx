"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { FallingLines } from "react-loader-spinner";
import { Fetch_to } from "@/utilities";

export default function Main() {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setChatres({ ...chatres, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!chatres.ask.trim()) return;

        setStatus(true);
        setLoading(true);

        const userMessage = { ask: chatres.ask, respond: "" }; 
        setMessages((prev) => [...prev, userMessage]);

        const prompt = chatres.ask; 
        setChatres({ ask: "", respond2: "" });

        const response = await Fetch_to("/services/api/response", { prompt });

        setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
                ask: prompt,
                respond: response.success
                    ? response.data.message.data.markdown
                    : response.message,
            };
            return updated;
        });

        setLoading(false);
    };



    return(
        <section className={`${styles.container} display_flex_center_column`}>
            <section className={`${styles.header} display_flex_center`}>
                    <h2>Laco AI</h2>
            </section>
            
               {status ?(
                <section className={styles.chat}>
                    <div className="display_flex_center_column">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${styles.response}`}>
                                <div className={`${styles.user_respones} display_flex_center`}>
                                    <div>
                                        <p>{msg.ask}</p>
                                    </div>
                                </div>
                                <div ref={chatEndRef} className={`${styles.ai_response} ${msg.respond ? styles.fadeIn : ""}`}>
                                    {msg.respond ? (
                                        <Markdown>{msg.respond}</Markdown>
                                    ) : index === messages.length - 1 && loading ? (
                                        <div className={`${styles.spinner_wrapper} display_flex_center`}>
                                            <FallingLines 
                                                width="100"
                                                color="#4fa94d"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
               ) : (
                    
                    <h1>Ask Anything or Upload your PDF file</h1>
                    
               )}
            
            <form className={`${styles.ask} display_flex_center`} onSubmit={handleSubmit}>
                <span>+</span>
                <textarea
                id="chat"
                name="ask"
                placeholder="Ask anything"
                value={chatres.ask}
                onChange={(e) => {
                    handleChange(e);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).style.height = "auto";
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                }}
                className={styles.expandableInput}
                autoComplete="off"
                spellCheck={false}
                />
                <button disabled={loading}>Ask</button>
            </form>
        </section>
    );
}