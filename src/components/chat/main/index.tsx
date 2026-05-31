"use client";
import styles from "./css/styles.module.css";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { DownloadAsPDF, SweetAlert2, Fetch_toFile, CopyToClipboard } from "@/utilities";
import { handleChatSubmit, streamVoiceToText, startRecording as startRecordingModule } from "@/modules";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import Swal from "sweetalert2";

type MainProps = {
    emailRes: string;
    currentPdf: number | undefined;
    currentImg: string | undefined;
    inMobile: boolean;
    f_name: string;
    setGlobalRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function Main({ emailRes, currentPdf, setGlobalRefresh, f_name, currentImg, inMobile}: MainProps) {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fx_effects, setFx_effects] = useState(false);
    const [fx_effects2, setFx_effects2] = useState(false);
    const [copy, setCopy] = useState(false);
    const [email, setEmail] = useState("");
    const [pdf_id, setPdf_id] = useState<number | undefined>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const canSend = chatres.ask.trim().length > 0;
    const [streamFadeMs, setStreamFadeMs] = useState(180);
    const [streamTick, setStreamTick] = useState(0);
    const [voiceStatus, setVoiceStatus] = useState("");
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
    const [scale, setScale] = useState(1);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (inMobile === false) return;
        setLoading(true);
        SweetAlert2("Analysing", "Checking Your Image", "process", false, "", false, "", true);
    }, [inMobile]);

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
        if (inMobile === false) return;
        if (inMobile && currentImg) {
            const autoPrompt = "Describe the contents of this image in detail.";
            setChatres((prev) => ({ ...prev, ask: autoPrompt }));
            void handleImageSubmit(undefined, autoPrompt);
            Swal.close();
        }
    }, [currentImg, inMobile]);

    useEffect(() => {
        setEmail(emailRes);
        setPdf_id(currentPdf);
    }, [emailRes, currentPdf]);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [chatres.ask]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopAudioVisualization();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setChatres({ ...chatres, [e.target.name]: value });
    };

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        const hasInvalid = files.some((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
        if (hasInvalid) {
            alert("Please select a PDF file.");
            return;
        }

        const response = await Fetch_toFile(api_link.storage.uploadPdf, files, { email: emailRes });
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

    const handleImageSubmit = async (
        e?: React.FormEvent<HTMLFormElement>,
        overridePrompt?: string
    ) => {
        e?.preventDefault();
        const promptText = (overridePrompt ?? chatres.ask).trim();
        if (!promptText) return;
        if (!currentImg) return;

        setStatus(true);
        setLoading(true);

        setMessages((prev) => {
            return [
                ...prev,
                { ask: promptText, respond: "" }
            ];
        });

        setChatres({ ask: "", respond2: "" });
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        // Use a callback to ensure correct context for API call and message update
        setTimeout(async () => {
            let lastUserResponse = "";
            let lastAIResponse = "";
            let msgIndex = 0;
            setMessages((prev) => {
                msgIndex = prev.length - 1;
                if (msgIndex > 0) {
                    lastUserResponse = prev[msgIndex - 1]?.ask || "";
                    lastAIResponse = prev[msgIndex - 1]?.respond || "";
                }
                return prev;
            });

            try {
                const response = await fetch(api_link.response_image_stream, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: promptText,
                        image_url: currentImg,
                        last_markdown: lastAIResponse,
                        user_reply: lastUserResponse,
                        email,
                    }),
                });

                const data = await response.json();
                if (!response.ok || !data?.success) {
                    throw new Error(data?.error || "Image request failed");
                }

                setMessages((prev) => {
                    const updated = [...prev];
                    if (msgIndex >= 0 && msgIndex < updated.length) {
                        updated[msgIndex] = {
                            ...updated[msgIndex],
                            respond: data?.markdown || "",
                        };
                    }
                    return updated;
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Image request failed";
                setMessages((prev) => {
                    const updated = [...prev];
                    if (msgIndex >= 0 && msgIndex < updated.length) {
                        updated[msgIndex] = {
                            ask: promptText,
                            respond: message,
                        };
                    }
                    return updated;
                });
            } finally {
                setLoading(false);
            }
        }, 0);
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
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
        } else {
            if (!currentImg) return SweetAlert2("Error", "Upload PDF or Image with Laco by Capture", "error", true, "Confirm", false, "", false);
            await handleImageSubmit(e);
            return;
        }
    };

    const handleCopyResponse = async (text: string) => {
        const copied = await CopyToClipboard(text);

        if (copied) {
            setCopy(true);
            setTimeout(() => {
                setCopy(false);
            }, 3000);
            return;
        }
    };

    const startAudioVisualization = (audioElement: HTMLAudioElement) => {
        if (!audioContextRef.current) {
            const AudioContextConstructor = window.AudioContext || ((window as unknown) as Record<string, typeof AudioContext>).webkitAudioContext;
            audioContextRef.current = new AudioContextConstructor();
        }

        const audioContext = audioContextRef.current;
        
        if (!analyserRef.current) {
            analyserRef.current = audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
        }

        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);

        const analyzeAudio = () => {
            if (!analyserRef.current || !dataArrayRef.current) return;

            // @ts-expect-error - getByteFrequencyData accepts ArrayBufferLike from Uint8Array
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Calculate average frequency to get beat/amplitude
            const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
            const normalizedAverage = Math.min(average / 256, 1); // Normalize to 0-1
            const scaleValue = 1 + normalizedAverage * 0.5; // Scale from 1 to 1.5
            
            setScale(scaleValue);

            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        };

        analyzeAudio();
    };

    const stopAudioVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setScale(1);
    };

    const playTts = async (text: string, onComplete?: () => void) => {
        const cleaned = text.trim();
        if (!cleaned) {
            onComplete?.();
            return;
        }

        try {
            const res = await fetch(api_link.tts, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: cleaned,
                    voice: "alloy",
                }),
            });

            if (!res.ok) {
                onComplete?.();
                return;
            }

            const buffer = await res.arrayBuffer();
            const blob = new Blob([buffer], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);

            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                URL.revokeObjectURL(ttsAudioRef.current.src);
            }

            const audio = new Audio(url);
            ttsAudioRef.current = audio;

            audio.onended = () => {
                stopAudioVisualization();
                URL.revokeObjectURL(url);
                setFx_effects2(false);
                onComplete?.();
            };
            audio.onerror = () => {
                stopAudioVisualization();
                URL.revokeObjectURL(url);
                setFx_effects2(false);
                onComplete?.();
            };
            
            audio.onplay = () => {
                startAudioVisualization(audio);
                setVoiceStatus("");
                setFx_effects2(false);
            };
            
            audio.onpause = () => {
                stopAudioVisualization();
            };

            await audio.play();
        } catch {
            onComplete?.();
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

    const startRecording = () => {
        void startRecordingModule({
            isMediaSupported,
            loading,
            email,
            pdf_id,
            f_name,
            setStatus,
            setLoading,
            setFx_effects,
            setFx_effects2,
            setVoiceStatus,
            mediaRecorderRef,
            audioChunksRef,
            voiceResponseRef,
            voiceAutoPlayRef,
            recordingTimeoutRef,
            setChatres,
            textareaRef,
            setMessages,
            voiceMessageIndexRef,
            messages,
            streamVoiceToText,
            playTts,
            setIsRecording,
        });
    };

    // const stopRecording = () => {
    //     if (!mediaRecorderRef.current) return;
    //     if (mediaRecorderRef.current.state === "inactive") return;
    //     if (recordingTimeoutRef.current) {
    //         clearTimeout(recordingTimeoutRef.current);
    //         recordingTimeoutRef.current = null;
    //     }
    //     mediaRecorderRef.current.stop();
    //     setIsRecording(false);
    // };

    

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
                                                    <Markdown>{msg.respond}</Markdown>
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
                                            <div className={`${styles.spinner_wrapper}`}>
                                                <p className="gradientTextAnimation">Thinking...</p>
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
                        width={110}
                        height={110}
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
                            multiple
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

            <section className={fx_effects2 ? styles.fx_effects : styles.fx_effects_close} />
            {fx_effects ? (
                <div className={styles.laco_voice} style={{ 
                    transform: `scale(${scale})`,
                    transition: "transform 0.1s ease-out"
                }} />
            ): null}
            {fx_effects ? (
                <h3 className="gradientTextAnimation" style={{
                    position: "fixed",
                    bottom: "130px"
                }}>{voiceStatus}</h3>
            ): null}
            
            {loading ? (
                <div className={styles.form_fx_effects} style={{ display: status ? "flex" : "none" }} />
            ): null}
            <div className={styles.form_contain}>
                <span className={styles.suggestions}>
                    <button>Create Research Proposal</button>
                    <button>Identify this study</button>
                </span>
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
                            disabled={!isMediaSupported && !loading}
                            onClick={() => (startRecording())}
                            style={{ opacity: isMediaSupported && !loading ? "1" : "0.5" }}
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
            </div>
        </section>
    );
}