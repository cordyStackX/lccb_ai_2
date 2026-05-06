"use client";
import styles from "./css/styles.module.css";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { ThreeDots } from "react-loader-spinner";
import { DownloadAsPDF, SweetAlert2, Fetch_toFile } from "@/utilities";
import { handleChatSubmit, streamVoiceToText } from "@/modules";
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
    const canSend = chatres.ask.trim().length > 0;
    const [streamFadeMs, setStreamFadeMs] = useState(180);
    const [streamTick, setStreamTick] = useState(0);
    const lastChunkAtRef = useRef<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const voiceMessageIndexRef = useRef<number | null>(null);
    const voiceResponseRef = useRef("");
    const recordingTimeoutRef = useRef<number | null>(null);
    const voiceAutoPlayRef = useRef(false);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    // const [ttsReplayUrl, setTtsReplayUrl] = useState<string | null>(null);
    // const [ttsReplayIndex, setTtsReplayIndex] = useState<number | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isMediaSupported, setIsMediaSupported] = useState(false);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView();
        }
    }, [messages]);

    useEffect(() => {
        const supported = typeof window !== "undefined"
            && typeof MediaRecorder !== "undefined"
            && typeof navigator !== "undefined"
            && Boolean(navigator.mediaDevices?.getUserMedia);
        setIsMediaSupported(supported);
    }, []);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf]);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [chatres.ask]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setChatres({ ...chatres, [e.target.name]: value });
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
    };

    const playTts = async (text: string) => {
        const cleaned = text.trim();
        if (!cleaned) return;

        try {
            const res = await fetch(api_link.tts, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: cleaned,
                    voice: "alloy",
                }),
            });

            if (!res.ok) return;

            const buffer = await res.arrayBuffer();
            const blob = new Blob([buffer], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);

            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                URL.revokeObjectURL(ttsAudioRef.current.src);
            }

            const audio = new Audio(url);
            ttsAudioRef.current = audio;
            // setTtsReplayUrl(url);
            // setTtsReplayIndex(voiceMessageIndexRef.current);

            audio.onended = () => {
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => {
                URL.revokeObjectURL(url);
            };

            await audio.play();
        } catch {
            return;
        }
    };

    // const replayTts = () => {
    //     if (!ttsReplayUrl) return;

    //     if (ttsAudioRef.current) {
    //         ttsAudioRef.current.pause();
    //     }

    //     const audio = new Audio(ttsReplayUrl);
    //     ttsAudioRef.current = audio;
    //     void audio.play();
    // };

    const startRecording = async () => {
        if (!isMediaSupported) return;
        if (!email || !pdf_id || !f_name) {
            SweetAlert2(
                "Missing context",
                "Upload a PDF and make sure your account is loaded before using voice input.",
                "warning",
                true,
                "OK",
                false,
                "",
                false
            );
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        voiceResponseRef.current = "";
        voiceAutoPlayRef.current = true;

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
                recordingTimeoutRef.current = null;
            }
            stream.getTracks().forEach((track) => track.stop());
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            if (audioBlob.size === 0) return;

            setStatus(true);
            setLoading(true);
            setChatres({ ask: "", respond2: "" });
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            setMessages((prev) => {
                const next = [...prev, { ask: "Transcribing audio...", respond: "" }];
                voiceMessageIndexRef.current = next.length - 1;
                return next;
            });

            const lastMessage = messages[messages.length - 1];
            const lastUserResponse = lastMessage?.ask || "";
            const lastAIResponse = lastMessage?.respond || "";

            streamVoiceToText({
                apiUrl: api_link.voice_stream,
                audioBlob,
                email,
                pdfId: pdf_id,
                fName: f_name,
                lastUserResponse,
                lastAiResponse: lastAIResponse,
                onPrompt: (prompt) => {
                    voiceResponseRef.current = "";
                    setMessages((prev) => {
                        const updated = [...prev];
                        const index = voiceMessageIndexRef.current;
                        if (index === null || index >= updated.length) {
                            updated.push({ ask: `Transcription: ${prompt}`, respond: "" });
                            voiceMessageIndexRef.current = updated.length - 1;
                            return updated;
                        }
                        updated[index] = { ...updated[index], ask: `Transcription: ${prompt}` };
                        return updated;
                    });
                },
                onText: (text) => {
                    voiceResponseRef.current += text;
                    
                    setMessages((prev) => {
                        const updated = [...prev];
                        const index = voiceMessageIndexRef.current;
                        if (index === null || index >= updated.length) {
                            voiceMessageIndexRef.current = updated.length - 1;
                            return updated;
                        }
                        const current = updated[index];
                        updated[index] = {
                            ...current,
                            respond: `${current.respond}${text}`,
                        };
                        return updated;
                    });

                },
                onError: (message) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const index = voiceMessageIndexRef.current;
                        if (index === null || index >= updated.length) {
                            voiceMessageIndexRef.current = updated.length - 1;
                            return updated;
                        }
                        updated[index] = {
                            ...updated[index],
                            respond: message,
                        };
                        return updated;
                    });
                    voiceMessageIndexRef.current = null;
                },
                onDone: () => {
                    voiceMessageIndexRef.current = null;
                    if (voiceAutoPlayRef.current) {
                        void playTts(voiceResponseRef.current);
                    }
                    voiceAutoPlayRef.current = false;
                    setLoading(false);
                },
            });
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        // auto-stop after 10 seconds
        try {
            recordingTimeoutRef.current = window.setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                }
            }, 10000);
        } catch (e) {
            console.log("Error: ", e);
            // ignore in non-browser environments
        }
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === "inactive") return;
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }
        mediaRecorderRef.current.stop();
        setIsRecording(false);
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
                                                <div
                                                    key={index === messages.length - 1 ? `stream-${streamTick}` : `static-${index}`}
                                                    className={index === messages.length - 1 && loading ? styles.streamFade : undefined}
                                                    style={index === messages.length - 1 && loading ? { animationDuration: `${streamFadeMs}ms` } : undefined}
                                                >
                                                    <Markdown>{msg.respond}</Markdown>
                                                </div>
                                                {!(index === messages.length - 1 && loading) && (
                                                    <>
                                                        <button 
                                                            onClick={() => DownloadAsPDF(msg.respond, index)}
                                                            className={styles.downloadBtn}
                                                            title="Download as PDF"
                                                        >
                                                            📥 Download PDF
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
                                                    </>
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
                
                <button
                    type="submit"
                    disabled={!canSend || loading}
                    title="Send your message"
                    style={{ opacity: `${!canSend || loading ? "0.5" : "1" }` }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                    </svg>
                </button>
                {!canSend && (
                    <button
                        className={styles.micButton}
                        type="button"
                        title={isRecording ? "Stop recording" : "Start recording"}
                        disabled={!isMediaSupported}
                        onClick={() => (isRecording ? stopRecording() : startRecording())}
                        style={{ opacity: isMediaSupported ? "1" : "0.5" }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 10C5 13.3137 7.68629 16 11 16H13C16.3137 16 19 13.3137 19 10" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </button>
                )}
            </form>
        </section>
    );
}