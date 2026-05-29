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
    setCurrentImg: (val: string | undefined) => void;
    globalRefresh: boolean;
}

type PdfFile = {
    id?: number;
    file_name?: string;
    file_size_mb?: string;
    file?: string;
}

type ImageFile = {
    id?: number;
    email?: string;
    image_link?: string;
    image_name?: string;
    size_bytes?: string;
    size_kb?: string;
    size_mb?: string;
}

export default function Sidebars({ isOpen, emailRes, setCurrentPdf, setCurrentImg, globalRefresh }: SidebarsProps) {
    const pageSize = 10;
    const [profile, setProfile] = useState(false);
    const [data, setData] = useState<PdfFile[]>([]);
    const [imageData, setImageData] = useState<ImageFile[]>([]);
    const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();
    const [selectedImageId, setSelectedImageId] = useState<number | undefined>();
    const fileRef = useRef<HTMLInputElement>(null);
    const [refresh, setRefresh] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showNoData, setShowNoData] = useState(false);
    const [showNoDataImage, setShowNoDataImage] = useState(false);
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
        const handleClick = () => {
            setContextMenu({ visible: false, x: 0, y: 0 });
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

    const fetchImage = async () => {
        if (isLoading || !emailRes) return;
        setIsLoading(true);

        const response = await Fetch_to(api_link.storage.lbc_image_retieve, {
            email: emailRes
        });

        if (response.success) {
            const item = response.data.message;

            setImageData(item ? [item] : []);
            setCurrentImg(item.image_link);
            setShowNoDataImage(!item);
        } else {
            SweetAlert2("Error", response.message, "error", true, "Okay", false, "", false);
            setShowNoDataImage(true);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        setData([]);
        setOffset(0);
        setHasMore(true);
        setShowNoData(false);
        fetchPdfs(true);
        fetchImage();
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
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        const hasInvalid = files.some((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
        if (hasInvalid) {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", files.map((file) => file.name));

        const response = await Fetch_toFile(api_link.storage.uploadPdf, files, { email: emailRes });
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
                multiple
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={HandleFile}
                />
            </>
            <div className={`${styles.wrapper}`}>
                <section className={styles.options}>
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
                <section className={`${styles.chat_history}`}>
                    <div className={styles.image_base}>
                        <h3>Image Captures</h3>
                        <div className={styles.image_container}>
                            {imageData && imageData.length > 0 ? (
                                imageData.map((image, index) => (
                                    <span
                                    key={index}
                                    // onContextMenu={(e) => handleContextMenu(e, image.id, image.file)}
                                    style={{ backgroundColor: image.id === selectedImageId ? "var(--fx-color)" : ""}}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 4L7.5 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4H9z"
                                                stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                        <button key={index}
                                        onClick={() => setSelectedImageId(image.id)}
                                        title={image.image_name}
                                        style={{ fontWeight: image.id === selectedImageId ? "bold" : "" }}
                                        >  {image.image_name} <br /> {image.size_mb} MB </button>
                                    <span
                                    style={{ display: image.id === selectedImageId ? "block" : "none" }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5"/>
                                        </svg>
                                    </span>
                                    </span>
                                
                                ))
                            ) : (
                                <div>
                                    {showNoDataImage ? (
                                        <p style={{ textAlign: "center", padding: "1rem", color: "var(--foreground)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                            No IMAGE Found
                                        </p>
                                    ) : (
                                        <p style={{ textAlign: "center", marginTop: "30px" }} className="gradientTextAnimation" >Loading...</p>
                                    )}
                                </div>
                                
                            )}
                            {isLoading && data.length > 0 && (
                                <p>Loading...</p>
                            )}
                        </div>
                    </div>
                    
                    <div className={styles.pdf_base}>
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
        </aside>
    );
}

