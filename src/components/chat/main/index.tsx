"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { ThreeDots } from "react-loader-spinner";
import { Fetch_to, DownloadAsPDF } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";

type MainProps = {
    emailRes: string;
    currentPdf: number | undefined;
}

export default function Main({ emailRes, currentPdf }: MainProps) {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [pdf_id, setPdf_id] = useState<number | undefined>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [animatedText, setAnimatedText] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf]);

    // Typewriter animation effect
    useEffect(() => {
        if (messages.length === 0) return;
        
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.respond || loading) return;

        setIsAnimating(true);
        setLoading(true);
        setAnimatedText("");
        
        let currentIndex = 0;
        const fullText = lastMessage.respond;
        
        const intervalId = setInterval(() => {
            if (currentIndex < fullText.length) {
                setAnimatedText(fullText.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                setIsAnimating(false);
                setLoading(false);
                clearInterval(intervalId);
            }
        }, 10); // Faster speed for better UX

        return () => clearInterval(intervalId);
    }, [messages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setChatres({ ...chatres, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!chatres.ask.trim()) return;

        setStatus(true);
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

        const response = await Fetch_to(api_link.responses, {
            prompt,
            email,
            pdf_id,
            last_user_response: lastUserResponse,
            last_ai_response: lastAIResponse,
        });

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
                                            className={styles.plushie_talk_img}
                                            />
                                            <div>
                                                <Markdown>
                                                    {index === messages.length - 1 && isAnimating 
                                                        ? animatedText 
                                                        : msg.respond}
                                                </Markdown>
                                                {index === messages.length - 1 && isAnimating && (
                                                    <span className={styles.cursor}>▋</span>
                                                )}
                                                {!(index === messages.length - 1 && isAnimating) && (
                                                    <button 
                                                        onClick={() => DownloadAsPDF(msg.respond, index)}
                                                        className={styles.downloadBtn}
                                                        title="Download as PDF"
                                                    >
                                                        📥 Download PDF
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    ) : index === messages.length - 1 && loading ? (
                                        <div className={` ${styles.plushie_talk}`}>
                                            <Image 
                                            src={image_src.plushie}
                                            alt="plushie"
                                            width={45}
                                            height={50}
                                            className={styles.plushie_talk_img}
                                            />
                                            <div className={`${styles.spinner_wrapper}`}>
                                                <ThreeDots
                                                visible={true}
                                                height="30"
                                                width="50"
                                                color="#fff"
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
                        <div ref={chatEndRef}></div>
                    </div>
                </section>
               ) : (
                    
                    <section>
                        <h1>Welcome to LACO AI</h1>
                        <p style={{ textAlign: "center" }}>
                            Upload a PDF document and start asking questions about <br/> 
                            its content. I{"'"}ll help you understand and analyze your <br />
                            documents. 
                        </p>
                    </section>
                    
               )}
              
            <form className={`${styles.ask} `} onSubmit={handleSubmit} style={{ position: status ? "fixed" : "initial" }}>
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
                <button disabled={loading} title="Send your message" style={{ opacity: `${loading ? "0.5" : "1" }` }}>Ask</button>
            </form>
        </section>
    );
}