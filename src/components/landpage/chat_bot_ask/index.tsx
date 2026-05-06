"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
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

        const lastUserResponse = messages.length > 0
            ? messages[messages.length - 1].ask
            : "";
        const lastAIResponse = messages.length > 0
            ? messages[messages.length - 1].respond
            : "";

        try {
            const response = await fetch(api_link.responses2_stream, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    last_user_response: lastUserResponse,
                    last_ai_response: lastAIResponse,
                }),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || "Stream request failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const part of parts) {
                    if (!part.startsWith("data:")) continue;
                    const payloadText = part.replace(/^data:\s?/, "").trim();

                    let payload: { text?: string; done?: boolean; error?: string } | null = null;
                    try {
                        payload = JSON.parse(payloadText);
                    } catch {
                        payload = null;
                    }

                    if (!payload) continue;

                    if (payload.error) {
                        throw new Error(payload.error);
                    }

                    if (payload.done) {
                        break;
                    }

                    if (payload.text) {
                        setMessages((prev) => {
                            const updated = [...prev];
                            const lastIndex = updated.length - 1;
                            const lastItem = updated[lastIndex];
                            updated[lastIndex] = {
                                ...lastItem,
                                respond: `${lastItem.respond}${payload?.text || ""}`,
                            };
                            return updated;
                        });
                    }
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Streaming failed";
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ask: prompt,
                    respond: message,
                };
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    return(
        <section className={`${styles.container}`} style={{ right: `${show ? "1%" : "-100%" }` }} >
            <span onClick={() => {setShow(false);}} >X</span>
            <h2>Chat Bot</h2>
            <section className={styles.chat}>
                <div>
                    {messages.map((msg, index) => (
                        <div key={index} className={`${styles.response}`}>
                            <div className={`${styles.user_respones}`}>
                                <div>
                                    <p>{msg.ask}</p>
                                </div>
                            </div>
                            <div ref={chatEndRef} className={`${styles.ai_response} ${msg.respond ? styles.fadeIn : ""}`}>
                                {msg.respond ? (
                                    <div className={` ${styles.plushie_talk}`}>
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
                                    <div className={` ${styles.plushie_talk}`}>
                                        <Image 
                                        src={image_src.plushie}
                                        alt="plushie"
                                        width={45}
                                        height={50}
                                        />
                                        <div className={`${styles.spinner_wrapper} `}>
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

            <form className={`${styles.ask}`} onSubmit={handleSubmit}>
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