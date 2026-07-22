"use client";
import styles from "./css/styles.module.scss";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { Fetch_to } from "@/utilities";
import remarkGfm from "remark-gfm";

// Suggestions are plain strings shown in the typeahead dropdown.
// The API may return plain strings, or objects like { suggest: string }
// (or similarly-shaped objects) — normalizeSuggestions handles both.

type Suggestion = string;

function normalizeSuggestions(raw: unknown[]): Suggestion[] {
    const result: string[] = [];

    const pushMaybeArray = (value: unknown) => {
        if (typeof value === "string") {
            const trimmed = value.trim();

            // If it looks like a JSON array string, try to parse and flatten it
            if (trimmed.startsWith("[")) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((v) => {
                            if (typeof v === "string" && v.trim().length > 0) {
                                result.push(v.trim());
                            }
                        });
                        return;
                    }
                } catch {
                    // not valid JSON, fall through and treat as plain string
                }
            }

            if (trimmed.length > 0) result.push(trimmed);
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((v) => {
                if (typeof v === "string" && v.trim().length > 0) {
                    result.push(v.trim());
                }
            });
        }
    };

    for (const item of raw) {
        if (typeof item === "string" || Array.isArray(item)) {
            pushMaybeArray(item);
            continue;
        }

        if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            const candidate = obj.suggest ?? obj.text ?? obj.label ?? obj.value ?? obj.name;
            pushMaybeArray(candidate);
        }
    }

    return result;
}

type Chat_botProps = {
    email: string;
}

export default function Chat_bot({ email } : Chat_botProps) {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [chatbot, setChatbot] = useState({
        name: "", instructions: "", body: ""
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [loadingBranding, setLoadingBranding] = useState(true);

    const [showTypeahead, setShowTypeahead] = useState(false);
    const typeaheadMatches = chatres.ask.trim()
        ? suggestions.filter((s): s is string =>
            typeof s === "string" && s.toLowerCase().includes(chatres.ask.trim().toLowerCase())
        ).slice(0, 5)
        : [];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await Fetch_to(api_link.storage.fetchimg, { email: email });
                if (response.success) {
                    setLogoPreview(response.data.message[0]?.file_link || null);
                }
            } catch (e) {
                console.error("Failed to fetch branding:", e);
            } finally {
                setLoadingBranding(false);
            }
        };
        fetchBranding();
    }, [email]);

    useEffect(() => {
        async function Suggest() {
            const response = await Fetch_to(api_link.storage.retrieve_chatbot_suggest, { email: email });
            if (response.success && Array.isArray(response.data?.message)) {
                setSuggestions(normalizeSuggestions(response.data.message));
            }
        }
        Suggest();
        async function Chatbot() {
            const response = await Fetch_to(api_link.chatbot_public, { email: email });
            const result = response.data?.message?.[0] || { name: "Sample AI", instruction: "Ask about ---", body: "velit voluptate doloremque magnam sequi, culpa nam consequatur eaque libero. Dolores." };
            if (response.success) {
                setChatbot(prev => ({ ...prev, name: result.name, instructions: result.instruction, body: result.body }));
            }
        }
        Chatbot();
    }, [email]);

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
                    email: email
                }),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || "Stream request failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let streamDone = false;

            while (!streamDone) {
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
                        streamDone = true;
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

            // Release the reader once we've deliberately stopped early on `done`.
            if (streamDone) {
                await reader.cancel().catch(() => {});
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
        submitPrompt(text);
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
                                                <Markdown remarkPlugins={[remarkGfm]}>{msg.respond}</Markdown>
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
                    {loadingBranding ? (
                        <div className={styles.brandingLogoSkeleton} />
                    ) : logoPreview ? (
                        <div className={styles.brandingLogo}>
                            <Image src={logoPreview} alt={`${chatbot.name} logo`} width={80} height={80} />
                        </div>
                    ) : null}
                    
                    <span className={styles.eyebrow}> {chatbot.name?.toUpperCase()} </span>
                    <h1> {chatbot.instructions} </h1>
                    <p> {chatbot.body} </p>
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
                    placeholder={`Ask about ${chatbot.name}...`}
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
                            submitPrompt(chatres.ask);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                    </svg>
                </button>
            </form>
        </section>
    );
}