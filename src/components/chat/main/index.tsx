"use client";
import styles from "./css/styles.module.css";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { ThreeDots } from "react-loader-spinner";
import { Fetch_to, DownloadAsPDF, SweetAlert2, Fetch_toFile } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import Swal from "sweetalert2";

type MainProps = {
    emailRes: string;
    currentPdf: number | undefined;
    f_name: string;
    setGlobalRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function Main({ emailRes, currentPdf, setGlobalRefresh, f_name }: MainProps) {
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
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf]);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [chatres.ask]);

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

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", file);

        const response = await Fetch_toFile(api_link.storage.uploadPdf, file, { email: emailRes });
        Swal.close();

        setGlobalRefresh(true);

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
            
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }

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
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        const lastUserResponse = messages.length > 0
            ? messages[messages.length - 1].ask
            : "";
        const lastAIResponse = messages.length > 0
            ? messages[messages.length - 1].respond
            : "";

        const response = await Fetch_to(api_link.responses, {
            prompt: prompt,
            email: email,
            pdf_id: pdf_id,
            f_name: f_name,
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
                                                {index === messages.length - 1 && isAnimating ? (
                                                    <pre className={styles.plainText}>
                                                        {animatedText}
                                                        <span className={styles.cursor}>▋</span>
                                                    </pre>
                                                ) : (
                                                    <Markdown>{msg.respond}</Markdown>
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
                                        <div className={styles.plushie_talk}>
                                            <Image 
                                            src={image_src.plushie}
                                            alt="plushie"
                                            width={45}
                                            height={50}
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
                    
                    <section className={styles.welcome_intro} style={{ padding: "10px" }} >
                        <Image 
                        src={image_src.lccb}
                        alt="logo"
                        title="logo"
                        width={80}
                        height={80}
                        />
                        <h1>Welcome to LACO AI</h1>
                        <svg className={styles.welcome_intro_svg1} width="40" height="3" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="5" x2="100" y2="5"  strokeWidth="5"/>
                        </svg>
                        <p style={{ textAlign: "center" }}>
                            Upload a PDF document to begin analysis. <br /> 
                            Ask questions to recieve explainations <br />
                            and insights 
                        </p>
                        {/* Hidden Input */}
                        <>
                            <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            style={{ display: "none" }}
                            onChange={HandleFile}
                            />
                        </>
                        <button onClick={UploadPdf}>
                            <svg className={styles.welcome_intro_svg2} width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 8L12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Upload PDF Document
                        </button>
                    </section>
                    
               )}
              
            <form className={`${styles.ask} `} onSubmit={handleSubmit} style={{ position: status ? "fixed" : "relative" }}>
                <svg className={styles.message_icons} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
                </svg>
                <textarea
                ref={textareaRef}
                id="chat"
                name="ask"
                placeholder="Ask questions about your document..."
                value={chatres.ask}
                onChange={(e) => {
                    handleChange(e);
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
                <button disabled={loading} title="Send your message" style={{ opacity: `${loading ? "0.5" : "1" }` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                    </svg>
                </button>
            </form>
        </section>
    );
}