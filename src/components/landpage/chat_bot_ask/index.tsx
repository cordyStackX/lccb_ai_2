"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
import { Fetch_to } from "@/utilities";
import Markdown from "react-markdown";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { ThreeDots } from "react-loader-spinner";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";

interface Chat_botProps {
    show: boolean;
    setShow: (val: boolean ) => void;
}

export default function Chat_bot({ show, setShow } : Chat_botProps) {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
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

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!chatres.ask.trim()) return;

        setLoading(true);

        const userMessage = { ask: chatres.ask, respond: "" }; 
        setMessages((prev) => [...prev, userMessage]);

        const prompt = chatres.ask; 
        setChatres({ ask: "", respond2: "" });

        const response = await Fetch_to(api_link.responses2, { prompt });

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
        <section className={`${styles.container} display_flex_center`} style={{ right: `${show ? "1%" : "-100%" }` }} >
            <span onClick={() => {setShow(false);}} >X</span>
            <h2>Chat Bot</h2>
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
                                    <div className={`display_flex_center ${styles.plushie_talk}`}>
                                        <Image 
                                        src={image_src.plushie}
                                        alt="plushie"
                                        width={45}
                                        height={50}
                                        />
                                        <div>
                                            <Markdown>{msg.respond}</Markdown>
                                        </div>

                                    </div>
                                ) : index === messages.length - 1 && loading ? (
                                    <div className={`display_flex_center ${styles.plushie_talk}`}>
                                        <Image 
                                        src={image_src.plushie}
                                        alt="plushie"
                                        width={45}
                                        height={50}
                                        />
                                        <div className={`${styles.spinner_wrapper} display_flex_center`}>
                                            <ThreeDots
                                            visible={true}
                                            height="30"
                                            width="50"
                                            color="#cd9b13"
                                            radius="9"
                                            ariaLabel="three-dots-loading"
                                            wrapperStyle={{}}
                                            wrapperClass=""
                                            />
                                        </div>
                                    </div>
                                    
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <form className={`${styles.ask} display_flex_center`} onSubmit={handleSubmit}>
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
                    if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).style.height = "auto";
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                }}
                className={styles.expandableInput}
                autoComplete="off"
                spellCheck={false}
                />
                <button disabled={loading} style={{ opacity: `${loading ? "0.5" : "1" }` }}>Ask</button>
            </form>
        </section>
    );
}