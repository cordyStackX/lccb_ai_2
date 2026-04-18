"use client";
import styles from "./css/styles.module.css";
import { useEffect, useRef, useState } from "react";
import { SweetAlert2, Fetch_toFile, Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface PdfFile {
    id?: number;
    file_name?: string;
    file?: string;
    summary?: string;
}

const PAGE_SIZE = 30;

export default function Chat_bot() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<PdfFile[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    useEffect(() => {
        const retrieve_pdf = async () => {
            const response = await Fetch_to(api_link.storage.retrieve_chatbot, {
                email: "admin@admin.com",
                page,
                limit: PAGE_SIZE,
                search,
            });
            if (response.success) {
                console.log(response.data.message);
                setData(response.data.message);
                setTotalPages(response.data.totalPages ?? 1);
            }
            setRefresh(false);
        };
        retrieve_pdf();
    }, [refresh, page, search]);

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", file);

        const response = await Fetch_toFile(api_link.storage.uploadpdf_chatbot , file, { email: "admin@admin.com" });
        Swal.close();

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            setRefresh(!refresh);
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

    const DownloadFile = async (pdf: PdfFile) => {
        if (!pdf.file) return;
        SweetAlert2("Downloading", "Please wait..", "info", false, "", false, "", true);
        const response = await Fetch_to(api_link.storage.downloadpdf_chatbot, { filePath: pdf.file });
        Swal.close();

        if (response.success && response.data?.url) {
            const anchor = document.createElement("a");
            anchor.href = response.data.url as string;
            anchor.download = pdf.file_name || "chatbot.pdf";
            anchor.rel = "noopener noreferrer";
            anchor.target = "_blank";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            return;
        }

        SweetAlert2("Error", `${response.message || "Download failed"}`, "error", true, "Confirm", false, "", false);
    };


    return(
        <section className={`${styles.container}`}>
            <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="5" width="12" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="10" cy="11" r="1" fill="currentColor"/>
                    <circle cx="14" cy="11" r="1" fill="currentColor"/>
                    <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h1>Chat Bot</h1>
                </span>

            </header>
            <section className={styles.search}>
                <input 
                type="text"
                name="search"
                id="search"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                />
                <button disabled={refresh} style={{ color: refresh ? 'var(--default-color-gray)' : '' }} onClick={() => {setRefresh(!refresh);}}>Refresh</button>
            </section>
            <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={HandleFile}
            />
            <section className={styles.status}>
                <span>
                    <h2>Your Documents</h2>
                    <button className={styles.button_upload} onClick={UploadPdf}>Upload PDF File</button>
                </span>
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Summary</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map((pdf, index) => (
                                    <tr key={index}>
                                        <td> {pdf.file_name} </td>
                                        <td> {pdf.summary} </td>
                                        <td >
                                            <button className={styles.button_download} onClick={() => DownloadFile(pdf)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7 10 12 15 17 10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                                </svg>
                                            </button>
                                            <button className={styles.button_delete} onClick={ async () => {
                                                SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
                                                const response = await Fetch_to(api_link.storage.deletepdf, { id: pdf.id, filePath: pdf.file });
                                                Swal.close();
                                                if (response) {
                                                    setRefresh(!refresh);
                                                } else {
                                                    SweetAlert2("Error", `${response}`, "error", true, "Confirm", false, "", false);
                                                }
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M3 6h18"/>
                                                <path d="M8 6V4h8v2"/>
                                                <path d="M19 6l-1 14H6L5 6"/>
                                                <path d="M10 11v6M14 11v6"/>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                        No PDF Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            <div className={styles.pagination}>
                <button
                    className={styles.pageButton}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                >
                    Previous
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button
                    className={styles.pageButton}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </section>
    );

}