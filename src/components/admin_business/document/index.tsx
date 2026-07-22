"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Popup_info } from "@/utilities";
import Markdown from "react-markdown";
import { DocFile, useDocumentTable } from "@/modules/documents/useDocumentTable";
import remarkGfm from "remark-gfm";

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

// Small countdown toast shown while a delete is pending, with an Undo button.
function UndoToast({ count, onUndo }: { count: number; onUndo: () => void }) {
    const [secondsLeft, setSecondsLeft] = useState(5);

    useEffect(() => {
        setSecondsLeft(5);
        const interval = setInterval(() => {
            setSecondsLeft((s) => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [count]);

    return (
        <div className={styles.undoToast}>
            <span>{count > 1 ? `${count} files deleted` : "File deleted"} ({secondsLeft}s)</span>
            <button onClick={onUndo}>Undo</button>
        </div>
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
        downloadFile, deleteFile, undoDelete, pendingDeleteIds,
        selectedIds, toggleSelect, toggleSelectAll, deleteSelected,
    } = table;

    const [viewingDoc, setViewingDoc] = useState<DocFile | null>(null);

    const visibleIds = data.map((doc) => doc.id).filter((id): id is number => id !== undefined);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const selectedCount = selectedIds.size;
    const pendingCount = pendingDeleteIds.size;

    return (
        <section className={`${styles.status} ${sensitive ? styles.statusSensitive : ""}`}>
            <span className={styles.sectionHeader}>
                <span className={styles.sectionTitleGroup}>
                    {sensitive && <LockIcon />}
                    <h2>{title}</h2>
                </span>
                <span className={styles.sectionActions}>
                    {selectedCount > 0 && (
                        <button className={styles.button_delete_bulk} onClick={deleteSelected}>
                            <DeleteIcon /> Delete {selectedCount} selected
                        </button>
                    )}
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
                            <th>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => toggleSelectAll(visibleIds)}
                                    aria-label="Select all files"
                                />
                            </th>
                            <th>File Name</th>
                            <th>Suggestions key</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : data && data.length > 0 ? (
                            data.map((doc: DocFile, index: number) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={doc.id !== undefined && selectedIds.has(doc.id)}
                                            onChange={() => toggleSelect(doc.id)}
                                            aria-label={`Select ${doc.file_name}`}
                                        />
                                    </td>
                                    <td className={styles.file_name}>{doc.file_name}</td>
                                    <td className={styles.file_name}> {doc.suggest} </td>
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
                                <td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>
                                    No PDF Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pendingCount > 0 && (
                <UndoToast
                    count={pendingCount}
                    onUndo={() => undoDelete(Array.from(pendingDeleteIds))}
                />
            )}

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
                            <Markdown remarkPlugins={[remarkGfm]}>{viewingDoc.summary || "No summary available."}</Markdown>
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

type Chat_botProps = {
    email: string;
}

export default function Chat_bot({ email } : Chat_botProps) {

    // NOTE: api_link.storage.retrieve_sensitive / uploadpdf_sensitive /
    // downloadpdf_sensitive / deletepdf_sensitive are placeholder keys —
    // add matching routes to fetch_url.json and a separate backend
    // route/bucket with restricted RLS before wiring real grade data here.
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");

    // Started: show the "in progress" popup (green, spinning)
    const showLoading = (status: string) => {
        setIsLoadStatus(status);
        setIsLoadState(true);
        setIsLoadStateDone(true);
    };

    // Success: switch to the "done" variant, then auto-hide
    const showSuccess = (status: string) => {
        setIsLoadStatus(status);
        setIsLoadError(false);
        setIsLoadStateDone(false);
        setTimeout(() => setIsLoadState(false), 2000);
    };

    // Error: switch to the red/error variant, then auto-hide
    const showError = (status: string) => {
        setIsLoadStatus(status);
        setIsLoadStateDone(false);
        setIsLoadError(true);

        setTimeout(() => setIsLoadState(false), 2500);
    };

    const notifyHandlers = { onStart: showLoading, onSuccess: showSuccess, onError: showError };

    const publicDocs = useDocumentTable(
        {
            retrieve: api_link.storage.retrieve_chatbot,
            upload: api_link.storage.uploadpdf_chatbot,
            download: api_link.storage.downloadpdf_chatbot,
            delete: api_link.storage.deletepdf_chatbot,
        },
        email,
        notifyHandlers
    );

    return (
        <section className={styles.container}>
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
            <header className={styles.header_cons}>
                <span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M8 13h8M8 17h8M8 9h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h1>Documents</h1>
                </span>
            </header>

            <div className={styles.tablesRow}>
                <DocumentTableSection
                    title="Public Documents"
                    description="Visible to the chatbot for general Q&A."
                    table={publicDocs}
                />
            </div>
        </section>
    );
}