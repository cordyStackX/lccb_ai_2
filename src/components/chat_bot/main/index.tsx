"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { ThreeDots } from "react-loader-spinner";
import { Fetch_to, Fetch_toFile, SweetAlert2 } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";

type MainProps = {
    emailRes: string;
    refresh: boolean;
    currentPdf: number | undefined;
    setRefresh: (val: boolean) => void;
}

export default function Main({ emailRes, refresh, setRefresh, currentPdf }: MainProps) {
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
    const fileRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf]);

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

        const response = await Fetch_to(api_link.responses, { prompt, email, pdf_id });

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

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
            setRefresh(!refresh);
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }

    };

    return(
        <section className={`${styles.container} display_flex_center_column`}>
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
               ) : (
                    
                    <h1>Upload your PDF file and Choose your documents</h1>
                    
               )}
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
            <form className={`${styles.ask} display_flex_center`} onSubmit={handleSubmit} style={{ position: status ? "fixed" : "initial" }}>
                <span onClick={UploadPdf}>+</span>
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