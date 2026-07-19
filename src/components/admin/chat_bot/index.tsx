"use client";
import styles from "./css/styles.module.css";
import { useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Markdown from "react-markdown";
import { useRouter } from "next/navigation";
import { DocFile, useDocumentTable } from "@/modules/documents/useDocumentTable";

const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
);

const SKELETON_ROWS = 6;

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i}>
                    <td className={styles.file_name}>
                        <span className={`${styles.skeletonBar} ${styles.skeletonShort}`} />
                    </td>
                    <td>
                        <span className={styles.skeletonIcon} />
                        <span className={styles.skeletonIcon} />
                    </td>
                </tr>
            ))}
        </>
    );
}

interface DocumentTableSectionProps {
    title: string;
    description?: string;
    sensitive?: boolean;
    table: ReturnType<typeof useDocumentTable>;
}

function DocumentTableSection({ title, description, sensitive, table }: DocumentTableSectionProps) {
    const {
        fileRef, data, search, setSearch, page, setPage, totalPages,
        isLoading, refresh, setRefresh, triggerUpload, handleFile,
        downloadFile, deleteFile,
    } = table;

    const [viewingDoc, setViewingDoc] = useState<DocFile | null>(null);

    return (
        <section className={`${styles.status} ${sensitive ? styles.statusSensitive : ""}`}>
            <span className={styles.sectionHeader}>
                <span className={styles.sectionTitleGroup}>
                    {sensitive && <LockIcon />}
                    <h2>{title}</h2>
                </span>
                <span className={styles.sectionActions}>
                    <button className={styles.button_upload} onClick={triggerUpload}>
                        Upload PDF File
                    </button>
                </span>
            </span>
            {description && <p className={styles.sectionDescription}>{description}</p>}

            <div className={styles.search}>
                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <button
                    disabled={refresh}
                    style={{ color: refresh ? "var(--default-color-gray)" : "" }}
                    onClick={() => setRefresh(true)}
                >
                    Refresh
                </button>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                multiple
                style={{ display: "none" }}
                onChange={handleFile}
            />

            <div>
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : data && data.length > 0 ? (
                            data.map((doc: DocFile, index: number) => (
                                <tr key={index}>
                                    <td className={styles.file_name}>{doc.file_name}</td>
                                    <td>
                                        <button className={styles.button_view} onClick={() => setViewingDoc(doc)}>
                                            <ViewIcon />
                                        </button>
                                        <button className={styles.button_delete} onClick={() => deleteFile(doc)}>
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} style={{ textAlign: "center", padding: "2rem" }}>
                                    No PDF Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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

            {viewingDoc && (
                <div className={styles.modalOverlay} onClick={() => setViewingDoc(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{viewingDoc.file_name}</h3>
                            <button className={styles.modalClose} onClick={() => setViewingDoc(null)}>
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <Markdown>{viewingDoc.summary || "No summary available."}</Markdown>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.button_upload}
                                onClick={() => downloadFile(viewingDoc)}
                            >
                                <DownloadIcon /> Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default function Chat_bot() {
    const router = useRouter();

    // NOTE: api_link.storage.retrieve_sensitive / uploadpdf_sensitive /
    // downloadpdf_sensitive / deletepdf_sensitive are placeholder keys —
    // add matching routes to fetch_url.json and a separate backend
    // route/bucket with restricted RLS before wiring real grade data here.
    const publicDocs = useDocumentTable({
        retrieve: api_link.storage.retrieve_chatbot,
        upload: api_link.storage.uploadpdf_chatbot,
        download: api_link.storage.downloadpdf_chatbot,
        delete: api_link.storage.deletepdf_chatbot,
    });

    const sensitiveDocs = useDocumentTable({
        retrieve: api_link.storage.retrieve_sensitive,
        upload: api_link.storage.uploadpdf_sensitive,
        download: api_link.storage.downloadpdf_sensitive,
        delete: api_link.storage.deletepdf_sensitive,
    });

    return (
        <section className={styles.container}>
            <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="5" width="12" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
                        <circle cx="10" cy="11" r="1" fill="currentColor" />
                        <circle cx="14" cy="11" r="1" fill="currentColor" />
                        <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h1>Chat Bot</h1>
                </span>
                <button className={styles.button_upload} onClick={() => router.push("/chat_bot")}>
                    Open Chatbot
                </button>
            </header>

            <div className={styles.tablesRow}>
                <DocumentTableSection
                    title="Public Documents"
                    description="Visible to the chatbot for general Q&A."
                    table={publicDocs}
                />

                <DocumentTableSection
                    title="Sensitive Documents"
                    description="Restricted documents such as student grades. Not exposed to general chatbot queries."
                    sensitive
                    table={sensitiveDocs}
                />
            </div>
        </section>
    );
}