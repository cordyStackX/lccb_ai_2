"use client";
import styles from "./css/styles.module.scss";
import image_src from "@/config/images_links/assets.json";
import { SetStateAction, Dispatch, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Fetch_to, SweetAlert2, Fetch_toFile, Popup_info } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";

type SidebarsProps = {
    isOpen: boolean;
    emailRes: string;
    setCurrentPdf: (val: number | undefined) => void;
    setCurrentMsg: (val: number | undefined) => void;
    globalRefresh: boolean;
    globalRefreshMsg: boolean;
    setGlobalMessages: Dispatch<SetStateAction<{ ask: string; respond: string }[]>>;
}

type PdfFile = {
    id?: number;
    file_name?: string;
    file_size_mb?: string;
    file?: string;
}

type ChatHistoryItem = {
    id?: number;
    created_at?: string;
    history?: { ask: string; respond: string }[];
};

export default function Sidebars({ isOpen, emailRes, setCurrentPdf, globalRefresh, setGlobalMessages, globalRefreshMsg, setCurrentMsg }: SidebarsProps) {
    const pageSize = 10;
    const historyPageSize = 7;
    const [profile, setProfile] = useState(false);
    const [activeView, setActiveView] = useState<"pdf" | "chat">("pdf");
    const [data, setData] = useState<PdfFile[]>([]);
    const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();
    const [selectedMsgId, setSelectedMsgId] = useState<number | undefined>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [refresh, setRefresh] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showNoData, setShowNoData] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [showNoHistory, setShowNoHistory] = useState(false);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; pdfId?: number; file?: string }>({
        visible: false,
        x: 0,
        y: 0,
    });
    const [historyMenu, setHistoryMenu] = useState<{ visible: boolean; x: number; y: number; id?: number }>({
        visible: false,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        if (profile) setProfile(false);
    }, [isOpen]);

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => {
            setContextMenu({ visible: false, x: 0, y: 0 });
            setHistoryMenu({ visible: false, x: 0, y: 0 });
        };

        document.addEventListener("click", handleClick);

        return () => document.removeEventListener("click", handleClick);
    }, []);

    const fetchPdfs = async (reset = false) => {
        if (isLoading || (!hasMore && !reset) || !emailRes) return;
        setIsLoading(true);

        const nextOffset = reset ? 0 : offset;
        const response = await Fetch_to(api_link.storage.retrieve, {
            email: emailRes,
            limit: pageSize,
            offset: nextOffset,
        });

        if (response.success) {
            const items = response.data.message || [];
            setData((prev) => (reset ? items : [...prev, ...items]));
            setOffset(nextOffset + items.length);
            setHasMore(response.data.hasMore ?? items.length === pageSize);
            if (reset) {
                setShowNoData(items.length === 0);
            }
        } else if (reset) {
            setShowNoData(true);
        }

        setIsLoading(false);
    };

    const fetchChatHistory = async (reset = false) => {
        if (historyLoading || (!historyHasMore && !reset) || !emailRes) return;
        setHistoryLoading(true);

        const nextOffset = reset ? 0 : historyOffset;

        const response = await Fetch_to(api_link.retrieve_responses, {
            email: emailRes,
            limit: historyPageSize,
            offset: nextOffset,
        });

        if (response.success) {
            const items = response.data?.data || [];
            setChatHistory((prev) => (reset ? items : [...prev, ...items]));
            setHistoryOffset(nextOffset + items.length);
            setHistoryHasMore(response.data?.hasMore ?? items.length === historyPageSize);
            if (reset) {
                setShowNoHistory(items.length === 0);
            }
        } else {
            if (reset) {
                setShowNoHistory(true);
                setChatHistory([]);
            }
        }

        setHistoryLoading(false);
    };

    useEffect(() => {
        fetchChatHistory(true);
    }, [globalRefreshMsg]);

    useEffect(() => {
        setData([]);
        setOffset(0);
        setHasMore(true);
        setShowNoData(false);
        setHistoryOffset(0);
        setHistoryHasMore(true);
        fetchPdfs(true);
        fetchChatHistory(true);
    }, [emailRes, refresh, globalRefresh]);

    useEffect(() => {
        setCurrentPdf(selectedPdfId);
        setCurrentMsg(selectedMsgId);
    }, [selectedPdfId, setCurrentPdf, globalRefresh, selectedMsgId]);

    // Filter PDFs based on search query
    const filteredPdfs = data.filter(pdf => 
        pdf.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Uploading Your PDF File Please Wait...");

        const hasInvalid = files.some((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
        if (hasInvalid) {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", files.map((file) => file.name));

        const response = await Fetch_toFile(api_link.storage.uploadPdf, files, { email: emailRes });
        Swal.close();

        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
            setRefresh(!refresh);
        } else {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }

    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
            fetchPdfs();
        }
    };

    const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
            fetchChatHistory();
        }
    };

    const handleDeletePdf = async () => {
        if (!contextMenu.pdfId) return;

        const result = await SweetAlert2(
            "Delete PDF",
            "Are you sure you want to delete this PDF?",
            "warning",
            true,
            "Yes, delete it",
            true,
            "Cancel"
        );

        if (!result.isConfirmed) return;

        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Deleting Your PDF File Please Wait");

        const response = await Fetch_to(api_link.storage.deletepdf, {
            filePath: contextMenu.file,
            id: contextMenu.pdfId,
        });

        Swal.close();

        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            setContextMenu({ visible: false, x: 0, y: 0 });
            if (selectedPdfId === contextMenu.pdfId) {
                setSelectedPdfId(undefined);
            }
            setRefresh(!refresh);
        } else {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
        }
    };

    const handleDeleteHistory = async () => {
        if (!historyMenu.id) return;

        const result = await SweetAlert2(
            "Delete Chat History",
            "Are you sure you want to delete this chat history?",
            "warning",
            true,
            "Yes, delete it",
            true,
            "Cancel"
        );

        if (!result.isConfirmed) return;

        SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);

        const response = await Fetch_to(api_link.delete_responses, {
            email: emailRes,
            id: historyMenu.id,
        });

        Swal.close();

        if (response.success) {
            SweetAlert2("Deleted", "Chat history deleted successfully", "success", true, "Okay", false, "", false);
            setHistoryMenu({ visible: false, x: 0, y: 0 });
            setRefresh((value) => !value);
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
        }
    };

    return(
        <aside className={`${styles.container} ${isOpen ? styles.open : ""}`}>
             {/* Hidden Input */}
             {isLoadState ? (
                isLoadStateDone ? (
                    <Popup_info status={isLoadStatus} bg_color="var(--primary)" states={true} load={true} error={false} />
                ) : (
                    isLoadError ? (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-red)" states={false} load={true} error={true} />
                    ) : (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-green)" states={false} load={true} error={false} />
                    )
                )
                
             ) : null}
            <>
                <input
                ref={fileRef}
                type="file"
                multiple
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={HandleFile}
                />
            </>
            <div className={`${styles.wrapper}`}>
                <section className={styles.options}>
                    <button onClick={() => {window.location.reload();}} title="New Chat" >
                        New Chat
                    </button>
                    <button onClick={UploadPdf} title="Upload your pdf" >
                        Upload New PDF
                    </button>
                    <input 
                        type="text" 
                        placeholder="Search PDF" 
                        className={styles.search_pdf}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className={styles.viewTabs}>
                        <button
                            type="button"
                            className={activeView === "pdf" ? styles.tabActive : ""}
                            onClick={() => setActiveView("pdf")}
                        >
                            PDF
                        </button>
                        <button
                            type="button"
                            className={activeView === "chat" ? styles.tabActive : ""}
                            onClick={() => setActiveView("chat")}
                        >
                            History
                        </button>
                    </div>
                </section>

                <section className={`${styles.chat_history}`} style={{ display: activeView === "chat" ? "flex" : "none" }}>
                    <div className={styles.history_base}>
                        <h3>Chat History</h3>
                        <div className={styles.history_container} onScroll={handleHistoryScroll}>
                            {chatHistory.length > 0 ? (
                                chatHistory.map((chat, index) => {
                                    const firstMessage = chat.history?.[0]?.ask || "Chat session";
                                    const lastMessage = chat.history?.[chat.history.length - 1]?.respond || "";
                                    return (
                                        <span
                                            key={chat.id ?? index}
                                            className={styles.history_item}
                                            title={firstMessage}
                                             style={{ backgroundColor: chat.id === selectedMsgId ? "var(--fx-color)" : ""}}
                                            onClick={() => {
                                                setGlobalMessages(
                                                    (chat.history ?? []).map((msg) => ({
                                                    ask: msg.ask,
                                                    respond: msg.respond,
                                                    }))
                                                );
                                                setSelectedMsgId(chat.id);
                                            }}
                                        >
                                            <span className={styles.history_icon}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M7 8h10M7 12h6M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 0 1-2.2-.23L4 20l1.2-3.3A7.8 7.8 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            <span className={styles.history_title}>{firstMessage}</span>
                                            <span className={styles.history_preview}>
                                                {lastMessage ? lastMessage.slice(0, 80) : "No preview"}
                                            </span>
                                            <span
                                                className={styles.pdf_options}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTimeout(() => {
                                                        setHistoryMenu({
                                                            visible: true,
                                                            x: e.clientX,
                                                            y: e.clientY,
                                                            id: chat.id,
                                                        });
                                                    }, 0);
                                                }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="5" cy="12" r="2" fill="currentColor" />
                                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                                    <circle cx="19" cy="12" r="2" fill="currentColor" />
                                                </svg>
                                            </span>
                                        </span>
                                    );
                                })
                            ) : showNoHistory ? (
                                <p className={styles.no_history}>No chat history found.</p>
                            ) : (
                                <div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                </div>
                            )}
                            {historyLoading && chatHistory.length > 0 && (
                                <div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`} ></div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                
                    <div className={styles.pdf_base} style={{ display: activeView === "pdf" ? "block" : "none" }}>
                        <h3>PDF Documents</h3>
                        <div className={styles.pdf_container} onScroll={handleScroll}>
                            {data && data.length > 0 ? (
                                filteredPdfs.length > 0 ? (
                                    filteredPdfs.map((pdf, index) => (
                                        <span
                                        key={index}
                                        // onContextMenu={(e) => handleClick(e, pdf.id, pdf.file)}
                                        style={{ backgroundColor: pdf.id === selectedPdfId ? "var(--fx-color)" : ""}}
                                        >
                                            <Image
                                            src={image_src.pdf_icon}
                                            alt="Icons"
                                            width={30}
                                            height={30}
                                            className={styles.pdf_icon}
                                            />
                                            <button key={index}
                                            onClick={() => setSelectedPdfId(pdf.id)}
                                            title={pdf.file_name}
                                            style={{ fontWeight: pdf.id === selectedPdfId ? "bold" : "" }}
                                            >  {pdf.file_name} <br /> {pdf.file_size_mb} MB </button>
                                        <span
                                        style={{ display: pdf.id === selectedPdfId ? "block" : "none" }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5"/>
                                            </svg>
                                        </span>
                                        <span onClick={(e) => {
                                            e.stopPropagation();
                                            setTimeout(() => {
                                                setContextMenu({
                                                    visible: true,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    pdfId: pdf.id,
                                                    file: pdf.file,
                                                });
                                            }, 0);
                                        }} className={styles.pdf_options} >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <circle cx="5" cy="12" r="2" fill="currentColor"/>
                                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                                            <circle cx="19" cy="12" r="2" fill="currentColor"/>
                                            </svg>
                                        </span>
                                        </span>
                                    
                                    ))
                                ) : (
                                    <p style={{ textAlign: "center", padding: "1rem", color: "var(--foreground)" }}>
                                        No PDFs found matching &quot;{searchQuery}&quot;
                                    </p>
                                )
                            ) : (
                                <div>
                                    {showNoData ? (
                                        <p style={{ textAlign: "center", padding: "1rem", color: "var(--foreground)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                            No PDF Found
                                        </p>
                                    ) : (
                                        <div>
                                            <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                            <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                            <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                        </div>
                                    )}
                                </div>
                                
                            )}
                            {isLoading && data.length > 0 && (
                                <div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                    <div className={`gradientDivAnimation ${styles.fx_load}`}></div>
                                </div>
                            )}
                        </div>
                    </div>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    style={{
                        position: "fixed",
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: "var(--default-color-white)",
                        border: "1px solid var(--foreground)",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        padding: "4px 0",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {setSelectedPdfId(undefined);}}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 16px",
                            border: "none",
                            background: "var(--default-color-white)",
                            color: "var(--foreground)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(4, 0, 255, 0.5)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        ⚪ UnSelect PDF
                    </button>
                    <button
                        onClick={handleDeletePdf}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 16px",
                            border: "none",
                            background: "var(--default-color-white)",
                            color: "var(--foreground)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.5)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        🗑️ Delete PDF
                    </button>
                </div>
            )}
            {historyMenu.visible && (
                <div
                    style={{
                        position: "fixed",
                        top: historyMenu.y,
                        left: historyMenu.x,
                        backgroundColor: "var(--default-color-white)",
                        border: "1px solid var(--foreground)",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        padding: "4px 0",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleDeleteHistory}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 16px",
                            border: "none",
                            background: "var(--default-color-white)",
                            color: "var(--foreground)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        🗑️ Delete Chat
                    </button>
                </div>
            )}
        </aside>
    );
}
