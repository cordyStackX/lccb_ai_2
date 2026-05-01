"use client";
import styles from "./css/styles.module.css";
import image_src from "@/config/images_links/assets.json";
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Fetch_to, React_Spinners, SweetAlert2, Fetch_toFile } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Image from "next/image";

type SidebarsProps = {
    isOpen: boolean;
    emailRes: string;
    setCurrentPdf: (val: number | undefined) => void;
    globalRefresh: boolean;
}

type PdfFile = {
    id?: number;
    file_name?: string;
    file_size_mb?: string;
    file?: string;
}

export default function Sidebars({ isOpen, emailRes, setCurrentPdf, globalRefresh }: SidebarsProps) {
    const pageSize = 10;
    const [profile, setProfile] = useState(false);
    const [data, setData] = useState<PdfFile[]>([]);
    const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [refresh, setRefresh] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showNoData, setShowNoData] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; pdfId?: number; file?: string }>({
        visible: false,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        if (profile) setProfile(false);
    }, [isOpen]);

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0 });
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

    useEffect(() => {
        setData([]);
        setOffset(0);
        setHasMore(true);
        setShowNoData(false);
        fetchPdfs(true);
    }, [emailRes, refresh, globalRefresh]);

    useEffect(() => {
        setCurrentPdf(selectedPdfId);
    }, [selectedPdfId, setCurrentPdf, globalRefresh]);

    // Filter PDFs based on search query
    const filteredPdfs = data.filter(pdf => 
        pdf.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
            fetchPdfs();
        }
    };

    const handleContextMenu = (e: React.MouseEvent, pdfId?: number, file?: string) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            pdfId: pdfId,
            file: file,
        });
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

        SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);

        const response = await Fetch_to(api_link.storage.deletepdf, {
            filePath: contextMenu.file,
            id: contextMenu.pdfId,
        });

        Swal.close();

        if (response.success) {
            SweetAlert2("Deleted", "PDF deleted successfully", "success", true, "Okay", false, "", false);
            setContextMenu({ visible: false, x: 0, y: 0 });
            if (selectedPdfId === contextMenu.pdfId) {
                setSelectedPdfId(undefined);
            }
            setRefresh(!refresh);
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
        }
    };

    return(
        <aside className={`${styles.container} ${isOpen ? styles.open : ""}`}>
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
            <div className={`${styles.wrapper}`}>
                <section className={styles.options}>
                    <button onClick={UploadPdf} title="Upload your pdf" >
                        <svg className={styles.options_svg} width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 8L12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Upload New PDF
                    </button>
                    <input 
                        type="text" 
                        placeholder="Search PDF" 
                        className={styles.search_pdf}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                <section className={`${styles.chat_history}`}>
                    
                    <div className={styles.pdf_base}>
                        <h3>PDF Documents</h3>
                        <div className={styles.pdf_container} onScroll={handleScroll}>
                            {data && data.length > 0 ? (
                                filteredPdfs.length > 0 ? (
                                    filteredPdfs.map((pdf, index) => (
                                        <span
                                        key={index}
                                        onContextMenu={(e) => handleContextMenu(e, pdf.id, pdf.file)}
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
                                        <React_Spinners status="Fetching..."/>
                                    )}
                                </div>
                                
                            )}
                            {isLoading && data.length > 0 && (
                                <React_Spinners status="Loading more..." />
                            )}
                        </div>
                    </div>
                    
                </section>
                </section>           
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        🗑️ Delete PDF
                    </button>
                </div>
            )}
        </aside>
    );
}

