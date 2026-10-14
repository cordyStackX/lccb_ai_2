"use client";
import styles from "./css/styles.module.scss";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { DownloadAsPDF, CopyToClipboard, Fetch_to } from "@/utilities";
import { handleChatSubmit } from "@/modules";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import suggestions from "@/sources/suggestion.json";
import remarkGfm from "remark-gfm";

function useTypewriterPlaceholder(items: string[], options?: { typeSpeed?: number; deleteSpeed?: number; pauseMs?: number }) {
    const { typeSpeed = 45, deleteSpeed = 25, pauseMs = 1200 } = options ?? {};
    const [text, setText] = useState("");
    const indexRef = useRef(0); // which suggestion
    const charRef = useRef(0);  // how many chars typed
    const phaseRef = useRef<"typing" | "pausing" | "deleting">("typing");

    useEffect(() => {
        if (!items.length) return;

        let timeout: ReturnType<typeof setTimeout>;

        const tick = () => {
            const current = items[indexRef.current % items.length];

            if (phaseRef.current === "typing") {
                charRef.current += 1;
                setText(current.slice(0, charRef.current));

                if (charRef.current >= current.length) {
                    phaseRef.current = "pausing";
                    timeout = setTimeout(tick, pauseMs);
                    return;
                }
                timeout = setTimeout(tick, typeSpeed);
                return;
            }

            if (phaseRef.current === "pausing") {
                phaseRef.current = "deleting";
                timeout = setTimeout(tick, deleteSpeed);
                return;
            }

            // deleting
            charRef.current -= 1;
            setText(current.slice(0, charRef.current));

            if (charRef.current <= 0) {
                indexRef.current += 1;
                phaseRef.current = "typing";
                timeout = setTimeout(tick, pauseMs);
                return;
            }
            timeout = setTimeout(tick, deleteSpeed);
        };

        timeout = setTimeout(tick, typeSpeed);
        return () => clearTimeout(timeout);
    }, [items, typeSpeed, deleteSpeed, pauseMs]);

    return text;
}


type MainProps = {
    emailRes: string;
    currentPdf: number | undefined;
    currentMsg: number | undefined;
    f_name: string;
    setGlobalRefreshMsg: Dispatch<SetStateAction<boolean>>;
    setGlobalMessages: Dispatch<SetStateAction<{ ask: string; respond: string }[]>>;
    setCurrentMsg: Dispatch<SetStateAction<number | undefined>>
    globalMessages: { id?: number, ask: string; respond: string }[];
}

export default function Main({ setCurrentMsg, currentMsg, emailRes, currentPdf, f_name, globalMessages, setGlobalRefreshMsg}: MainProps) {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copy, setCopy] = useState(false);
    const [email, setEmail] = useState("");
    const [pdf_id, setPdf_id] = useState<number | undefined>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const canSend = chatres.ask.trim().length > 0;
    const animatedPlaceholder = useTypewriterPlaceholder(suggestions);
    const [showTypeahead, setShowTypeahead] = useState(false);
    const typeaheadMatches = chatres.ask.trim()
        ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(chatres.ask.trim().toLowerCase())).slice(0, 5)
        : suggestions.slice(0, 5);
    const [streamFadeMs, setStreamFadeMs] = useState(180);
    const [streamTick, setStreamTick] = useState(0);
    const lastChunkAtRef = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // const [ttsReplayUrl, setTtsReplayUrl] = useState<string | null>(null);
    // const [ttsReplayIndex, setTtsReplayIndex] = useState<number | null>(null);
    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf, globalMessages]);

    useEffect(() => {
        if (globalMessages.length > 0) {
            setStatus(true);
            setMessages(globalMessages);
        }
    }, [globalMessages]);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [chatres.ask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setChatres({ ...chatres, [e.target.name]: value });
        setShowTypeahead(true);
    };

    const handleTypeaheadSelect = (text: string) => {
        setChatres((prev) => ({ ...prev, ask: text }));
        setShowTypeahead(false);
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        setShowTypeahead(false);
        if (currentPdf) {
            await handleChatSubmit({
                event: e,
                chatInput: chatres.ask,
                setChatres,
                setStatus,
                setLoading,
                setMessages,
                setStreamFadeMs,
                setStreamTick,
                lastChunkAtRef,
                textareaRef,
                apiUrl: api_link.responses_stream,
                payloadBase: {
                    email,
                    pdf_id,
                    f_name,
                },
                messages,
            });
            
            
            setTimeout(async() => {
                const response = await Fetch_to(api_link.save_responses, {
                    id: currentMsg,
                    email: email,
                    messages: messagesRef.current,
                });
                if (response.success) {
                    if (!response.data.messages.id) return;
                    setCurrentMsg(response.data.messages.id);
                }
                setGlobalRefreshMsg(true);
            }, 100);


        } else {
            await handleChatSubmit({
                event: e,
                chatInput: chatres.ask,
                setChatres,
                setStatus,
                setLoading,
                setMessages,
                setStreamFadeMs,
                setStreamTick,
                lastChunkAtRef,
                textareaRef,
                apiUrl: api_link["response4-stream"],
                payloadBase: {
                    email,
                    pdf_id,
                    f_name,
                },
                messages,
            });

            setTimeout(async() => {
                const response = await Fetch_to(api_link.save_responses, {
                    id: currentMsg,
                    email: email,
                    messages: messagesRef.current,
                });
                if (response.success) {
                    if (!response.data.messages.id) return;
                    setCurrentMsg(response.data.messages.id);
                }
                setGlobalRefreshMsg(true);
            }, 100);
        
        }
    };

    const handleCopyResponse = async (text: string) => {
        const copied = await CopyToClipboard(text);

        if (copied) {
            setCopy(true);
            setTimeout(() => {
                setCopy(false);
            }, 1000);
            return;
        }
    };

    return(
        <section className={`${styles.container} `}>
               {status ?(
                <section className={styles.chat}>
                    <div>
                        {messages.map((msg, index) => (
                            <div key={index} className={`${styles.response}`}>
                                <div className={`${styles.user_respones}`}>
                                    <div>
                                        <p>{msg.ask}</p>
                                    </div>
                                </div>
                                <div className={`${styles.ai_response} ${msg.respond ? styles.fadeIn : ""}`}>
                                    {msg.respond ? (
                                        <div className={`${styles.plushie_talk}`}>
                                            <Image 
                                            src={image_src.plushie}
                                            alt="plushie"
                                            width={45}
                                            height={50}
                                            />
                                            <div>
                                                <div
                                                    key={index === messages.length - 1 ? `stream-${streamTick}` : `static-${index}`}
                                                    className={index === messages.length - 1 && loading ? styles.streamFade : undefined}
                                                    style={index === messages.length - 1 && loading ? { animationDuration: `${streamFadeMs}ms` } : undefined}
                                                >
                                                    <Markdown remarkPlugins={[remarkGfm]}>{msg.respond}</Markdown>
                                                </div>
                                                {!(index === messages.length - 1 && loading) && (
                                                    <div className={styles.buttons_links}>
                                                        <button 
                                                            onClick={() => DownloadAsPDF(msg.respond, index)}
                                                            title="Download as PDF"
                                                        >
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">                                                          
                                                                <path d="M12 3v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>       
                                                                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>                                                                    
                                                                <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>       
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => void handleCopyResponse(msg.respond)}
                                                            title="Copy"
                                                        >
                                                            {copy ? (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"                                
                                                                xmlns="http://www.w3.org/2000/svg">                                                          
                                                                    <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2"                    
                                                                strokeLinecap="round" strokeLinejoin="round"/>                                             
                                                                </svg>    
                                                            ) : (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"                                
                                                                xmlns="http://www.w3.org/2000/svg">                                                          
                                                                    <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/> 
                                                                    <path d="M5 15V7a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="2"                 
                                                                strokeLinecap="round"/>                                                                     
                                                                </svg>  
                                                            )}
                                                        </button>
                                                        {/* {ttsReplayUrl && ttsReplayIndex === index && (
                                                            <button
                                                                onClick={replayTts}
                                                                className={styles.downloadBtn}
                                                                title="Replay audio"
                                                            >
                                                                Replay Audio
                                                            </button>
                                                        )} */}
                                                    </div>
                                                )}
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
                                            <div className={styles.thinking} aria-label="Thinking">
                                                <span className={styles.dot} />
                                                <span className={styles.dot} />
                                                <span className={styles.dot} />
                                            </div>
                                        </div>
                                        
                                    ) : null}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef}></div>
                    </div>
                </section>
               ) : (
                    
                    <section className={styles.welcome_intro}>
                        <Image 
                        src={image_src.lccb}
                        alt="logo"
                        title="logo"
                        width={110}
                        height={110}
                        />
                        <h1>Welcome to LACO AI</h1>
                        <svg className={styles.welcome_intro_svg1} width="40" height="3" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="5" x2="100" y2="5"  strokeWidth="5"/>
                        </svg>
                        <p style={{ textAlign: "center" }}>
                            Upload a PDF document to begin analysis. or ask about your grades.<br /> 
                            Ask questions to recieve explainations <br />
                            and insights
                        </p>
                    </section>
                    
               )}

            <div className={`${styles.form_contain} ${status ? styles.form_active : styles.form_welcome}`}>
                <form className={`${styles.ask} `} onSubmit={handleSubmit} >
                    {showTypeahead && typeaheadMatches.length > 0 && (
                        <div className={styles.typeahead}>
                            {typeaheadMatches.map((match, index) => (
                                <button
                                    key={`${match}-${index}`}
                                    type="button"
                                    className={styles.typeaheadItem}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => handleTypeaheadSelect(match)}
                                >
                                    {match}
                                </button>
                            ))}
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        id="chat"
                        name="ask"
                        placeholder={animatedPlaceholder}
                        value={chatres.ask}
                        onChange={(e) => {
                            handleChange(e);
                        }}
                        onFocus={() => setShowTypeahead(true)}
                        onBlur={() => setShowTypeahead(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !loading) {
                                e.preventDefault();
                                (e.target as HTMLTextAreaElement).style.height = "auto";
                                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                            }
                            if (e.key === "Escape") setShowTypeahead(false);
                        }}
                        className={styles.expandableInput}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button
                        type="submit"
                        disabled={!canSend || loading}
                        title="Send your message"
                        className={styles.sendButton}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19V5" />
                            <path d="M5 12l7-7 7 7" />
                        </svg>
                    </button>
                </form>
            </div> 
        </section>
    );
}
