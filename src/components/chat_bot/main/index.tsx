"use client";
import styles from "./css/styles.module.scss";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";

// Swap this for your real sources/suggestion.json shape if it differs —
// kept as plain strings here so it drops in without guessing your schema.
const SUGGESTIONS: string[] = [];

export default function Chat_bot() {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [showTypeahead, setShowTypeahead] = useState(false);
    const typeaheadMatches = chatres.ask.trim()
        ? SUGGESTIONS.filter((s) =>
            s.toLowerCase().includes(chatres.ask.trim().toLowerCase())
          ).slice(0, 5)
        : [];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setChatres({ ...chatres, [e.target.name]: e.target.value });
    };

    const submitPrompt = async (rawPrompt: string) => {
        if (!rawPrompt.trim()) return;

        setStatus(true);
        setLoading(true);

        const userMessage = { ask: rawPrompt, respond: "" };
        setMessages((prev) => [...prev, userMessage]);

        const prompt = rawPrompt;
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

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        await submitPrompt(chatres.ask);
    };

    const handleTypeaheadSelect = (text: string) => {
        setChatres({ ...chatres, ask: text });
        setShowTypeahead(false);
    };

    return (
        <section className={styles.container}>
            {status ? (
                <section className={styles.chat}>
                    <div>
                        {messages.map((msg, index) => (
                            <div key={index} className={styles.response}>
                                <div className={styles.user_respones}>
                                    <div>
                                        <p>{msg.ask}</p>
                                    </div>
                                </div>
                                <div ref={chatEndRef} className={`${styles.ai_response} ${msg.respond ? styles.fadeIn : ""}`}>
                                    {msg.respond ? (
                                        <div className={styles.plushie_talk}>
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
                                        <div className={styles.plushie_talk}>
                                            <Image
                                                src={image_src.plushie}
                                                alt="plushie"
                                                width={45}
                                                height={50}
                                            />
                                            <div className={styles.thinking}>
                                                <span className={styles.dot} />
                                                <span className={styles.dot} />
                                                <span className={styles.dot} />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <section className={styles.introduction}>
                    <span className={styles.eyebrow}>LACO AI</span>
                    <h1>Ask about LCCB</h1>
                    <p>Admissions, programs, requirements, and more — pick a topic or type your question.</p>
                </section>
            )}

            <form className={styles.ask} onSubmit={handleSubmit}>
                {showTypeahead && typeaheadMatches.length > 0 && (
                    <div className={styles.typeahead}>
                        {typeaheadMatches.map((match, i) => (
                            <button
                                key={i}
                                type="button"
                                className={styles.typeaheadItem}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleTypeaheadSelect(match)}
                            >
                                {match}
                            </button>
                        ))}
                    </div>
                )}
                <textarea
                    id="chat"
                    name="ask"
                    placeholder="Ask about LCCB..."
                    value={chatres.ask}
                    onChange={(e) => {
                        handleChange(e);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                        setShowTypeahead(true);
                    }}
                    onFocus={() => setShowTypeahead(true)}
                    onBlur={() => setShowTypeahead(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !loading) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).style.height = "auto";
                            setShowTypeahead(false);
                            handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                        }
                        if (e.key === "Escape") {
                            setShowTypeahead(false);
                        }
                    }}
                    className={styles.expandableInput}
                    autoComplete="off"
                    spellCheck={false}
                />
                <button disabled={loading} className={styles.sendButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                    </svg>
                </button>
            </form>
        </section>
    );
}