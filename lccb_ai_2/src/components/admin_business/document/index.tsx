"use client";
import styles from "./css/styles.module.css";
import { useEffect, useRef, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to, Popup_info, SweetAlert2 } from "@/utilities";
import { DocFile, useDocumentTable } from "@/modules/documents/useDocumentTable";
import PdfViewer from "@/modules/documents/PdfViewer";
import UploadDisclaimer from "@/modules/documents/UploadDisclaimer";

const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
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
                    </td>
                    <td>
                        <span className={styles.skeletonIcon} />
                    </td>
                    <td>
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
    email: string;
    table: ReturnType<typeof useDocumentTable>;
    pdfDialogOpenerRef: { current: (() => void) | null };
    onLinkJourneyStart: (url: string) => void;
    onLinkJourneySuccess: () => void;
    onLinkJourneyError: (message: string) => void;
}

type JourneyStep = { label: string; detail: string; state: "waiting" | "active" | "complete" | "error" };
type Journey = { title: string; source: string; steps: JourneyStep[]; isFinished: boolean; startedAt: string; canRestart?: boolean; restoredFromStorage?: boolean };

function ProcessingJourney({ journey, onDismiss, onCancel, onRestart }: { journey: Journey; onDismiss: () => void; onCancel: () => void; onRestart: () => void }) {
    const activeStep = journey.steps.find((step) => step.state === "active" || step.state === "error");
    return (
        <aside className={styles.processingJourney} role="status" aria-live="polite">
            <div className={styles.journeyHeader}>
                <div>
                    <span className={styles.journeyEyebrow}>{journey.source}</span>
                    <h3>{journey.title}</h3>
                </div>
                {journey.canRestart
                    ? <button className={styles.journeyCancel} onClick={onRestart}>Reselect PDF</button>
                    : journey.isFinished
                    ? <button className={styles.journeyClose} onClick={onDismiss} aria-label="Dismiss progress notification">&times;</button>
                    : journey.source !== "Web link" && <button className={styles.journeyCancel} onClick={onCancel}>Cancel upload</button>}
            </div>
            <p className={styles.journeyStatus}>{activeStep ? activeStep.detail : "Everything is ready."}</p>
            <ol className={styles.journeySteps}>
                {journey.steps.map((step, index) => (
                    <li key={step.label} className={styles[`journey${step.state[0].toUpperCase()}${step.state.slice(1)}`]}>
                        <span className={styles.journeyMarker}>{step.state === "complete" ? "✓" : step.state === "error" ? "!" : index + 1}</span>
                        <span>{step.label}</span>
                    </li>
                ))}
            </ol>
        </aside>
    );
}

function DocumentTableSection({ title, description, sensitive, email, table, pdfDialogOpenerRef, onLinkJourneyStart, onLinkJourneySuccess, onLinkJourneyError }: DocumentTableSectionProps) {
    const {
        fileRef, data, search, setSearch, page, setPage, totalPages,
        isLoading, refresh, setRefresh, triggerUpload, handleFile, handleFiles,
        deleteFile, deleteSelected,
        selectedIds, toggleSelect, toggleSelectAll,
    } = table;

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [hasAcceptedUploadDisclaimer, setHasAcceptedUploadDisclaimer] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [webLink, setWebLink] = useState("");
    const [isUploadingLink, setIsUploadingLink] = useState(false);
    const [preview, setPreview] = useState<{ filePath: string; name: string } | null>(null);

    useEffect(() => {
        pdfDialogOpenerRef.current = () => {
            setIsAddDialogOpen(false);
            setIsLinkDialogOpen(false);
            setHasAcceptedUploadDisclaimer(false);
            setIsPdfDialogOpen(true);
        };
        return () => { pdfDialogOpenerRef.current = null; };
    }, [pdfDialogOpenerRef]);

    const openPdfPreview = (doc: DocFile) => {
        if (!doc.file) return;
        setPreview({ filePath: doc.file, name: doc.file_name || "PDF preview" });
    };

    const closePdfPreview = () => {
        setPreview(null);
    };

    const uploadWebLink = async () => {
        if (!webLink.trim()) return;
        const url = webLink.trim();
        setIsUploadingLink(true);
        onLinkJourneyStart(url);
        const response = await Fetch_to(api_link.storage.generate_link_chatbot, { email, url });
        setIsUploadingLink(false);
        if (!response.success || !response.data?.link) {
            onLinkJourneyError(response.message || "We could not process this web page.");
            await SweetAlert2("Unable to add web page", response.message || "Please check the URL and try again.", "error", true, "OK", false, "");
            return;
        }
        onLinkJourneySuccess();
        setWebLink("");
        setIsLinkDialogOpen(false);
        setRefresh(true);
    };

    const visibleIds = data.map((doc) => doc.id).filter((id): id is number => id !== undefined);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const selectedCount = selectedIds.size;

    const handleDeleteFile = async (doc: DocFile) => {
        const result = await SweetAlert2(
            "Delete File?",
            `Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`,
            "warning",
            true, "Delete",
            true, "Cancel"
        );
        if (result.isConfirmed) {
            deleteFile(doc);
        }
    };

    const handleDeleteSelected = async () => {
        const result = await SweetAlert2(
            "Delete Selected Files?",
            `Are you sure you want to delete ${selectedCount} selected file${selectedCount > 1 ? "s" : ""}? This action cannot be undone.`,
            "warning",
            true, "Delete",
            true, "Cancel"
        );
        if (result.isConfirmed) {
            deleteSelected();
        }
    };

    return (
        <section className={`${styles.status} ${sensitive ? styles.statusSensitive : ""}`}>
            <span className={styles.sectionHeader}>
                <span className={styles.sectionTitleGroup}>
                    {sensitive && <LockIcon />}
                    <h2>{title}</h2>
                </span>
                <span className={styles.sectionActions}>
                    {selectedCount > 0 && (
                        <button className={styles.button_delete_bulk} onClick={handleDeleteSelected}>
                            <DeleteIcon /> Delete {selectedCount} selected
                        </button>
                    )}
                    <button className={`${styles.button_upload} ${styles.addDocumentButton}`} onClick={() => setIsAddDialogOpen(true)}>
                        <span aria-hidden="true">＋</span> Add document
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
                onChange={(event) => {
                    if (!hasAcceptedUploadDisclaimer) {
                        event.target.value = "";
                        return;
                    }
                    handleFile(event);
                    setIsPdfDialogOpen(false);
                    setIsDragging(false);
                    setHasAcceptedUploadDisclaimer(false);
                }}
            />

            <div className={styles.tableScroll}>
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
                                        <button className={styles.button_view} title="View PDF" aria-label={`View ${doc.file_name || "PDF"}`} onClick={() => openPdfPreview(doc)}>
                                            <ViewIcon />
                                        </button>
                                        <button className={styles.button_delete} onClick={() => handleDeleteFile(doc)}>
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
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

            {preview && <PdfViewer filePath={preview.filePath} fileName={preview.name} onClose={closePdfPreview} />}
            {isAddDialogOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAddDialogOpen(false)}>
                    <div className={styles.addDialog} role="dialog" aria-modal="true" aria-labelledby="add-document-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div><span className={styles.dialogEyebrow}>ADD TO YOUR LIBRARY</span><h3 id="add-document-title">Add document</h3></div>
                            <button className={styles.modalClose} onClick={() => setIsAddDialogOpen(false)} aria-label="Close">&times;</button>
                        </div>
                        <p className={styles.addDialogIntro}>Choose how you’d like to add content to {sensitive ? "your sensitive documents" : "your library"}.</p>
                        <div className={styles.addChoices}>
                            <button className={styles.addChoice} onClick={() => { setIsAddDialogOpen(false); setHasAcceptedUploadDisclaimer(false); setIsPdfDialogOpen(true); }}>
                                <span className={styles.choiceIcon}>PDF</span><span><strong>Upload a PDF</strong><small>Choose a file from your device</small></span><span className={styles.choiceArrow}>›</span>
                            </button>
                            {!sensitive && <button className={styles.addChoice} onClick={() => { setIsAddDialogOpen(false); setIsLinkDialogOpen(true); }}>
                                <span className={`${styles.choiceIcon} ${styles.linkChoiceIcon}`} aria-hidden="true">↗</span><span><strong>Add a web link</strong><small>Turn a public webpage into a document</small></span><span className={styles.choiceArrow}>›</span>
                            </button>}
                        </div>
                    </div>
                </div>
            )}
            {isPdfDialogOpen && (
                <div className={styles.modalOverlay} onClick={() => { setIsPdfDialogOpen(false); setIsDragging(false); setHasAcceptedUploadDisclaimer(false); }}>
                    <div className={styles.pdfDialog} role="dialog" aria-modal="true" aria-labelledby="upload-pdf-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div><span className={styles.dialogEyebrow}>UPLOAD DOCUMENT</span><h3 id="upload-pdf-title">Upload a PDF</h3></div>
                            <button className={styles.modalClose} onClick={() => { setIsPdfDialogOpen(false); setIsDragging(false); setHasAcceptedUploadDisclaimer(false); }} aria-label="Close">&times;</button>
                        </div>
                        <UploadDisclaimer sensitive={false} accepted={hasAcceptedUploadDisclaimer} onAcceptedChange={setHasAcceptedUploadDisclaimer} />
                        <div className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""} ${!hasAcceptedUploadDisclaimer ? styles.dropZoneDisabled : ""}`} aria-disabled={!hasAcceptedUploadDisclaimer} onDragOver={(event) => { event.preventDefault(); if (hasAcceptedUploadDisclaimer) setIsDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={(event) => { event.preventDefault(); setIsDragging(false); if (!hasAcceptedUploadDisclaimer) return; void handleFiles(Array.from(event.dataTransfer.files)); setIsPdfDialogOpen(false); setHasAcceptedUploadDisclaimer(false); }}>
                            <span className={styles.uploadIcon} aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 32V8m0 0-9 9m9-9 9 9M10 28v10a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                            <strong>{hasAcceptedUploadDisclaimer ? "Drag and drop your PDF here" : "Accept the disclaimer above to continue"}</strong>
                            <span className={styles.dropHint}>{hasAcceptedUploadDisclaimer ? "or choose a file from your device" : "Your file will not be uploaded until you accept."}</span>
                            <button type="button" className={styles.browseButton} onClick={triggerUpload} disabled={!hasAcceptedUploadDisclaimer}>Browse files</button>
                            <small>PDF files only</small>
                        </div>
                    </div>
                </div>
            )}
            {isLinkDialogOpen && (
                <div className={styles.modalOverlay} onClick={() => !isUploadingLink && setIsLinkDialogOpen(false)}>
                    <div className={styles.linkDialog} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}><h3>Add a web page</h3><button className={styles.modalClose} disabled={isUploadingLink} onClick={() => setIsLinkDialogOpen(false)}>&times;</button></div>
                        <div className={styles.modalBody}>
                            <p>We will convert the readable web-page content into a PDF, then process it exactly like an uploaded PDF.</p>
                            <input className={styles.linkInput} type="url" placeholder="https://example.com/page" value={webLink} onChange={(event) => setWebLink(event.target.value)} disabled={isUploadingLink} />
                        </div>
                        <div className={styles.modalFooter}><button className={styles.button_upload} onClick={uploadWebLink} disabled={isUploadingLink || !webLink.trim()}>{isUploadingLink ? "Converting and generating..." : "Convert web page to PDF"}</button></div>
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
    const [journey, setJourney] = useState<Journey | null>(null);
    const restoredJourneyRef = useRef(false);
    const pdfDialogOpenerRef = useRef<(() => void) | null>(null);

    const beginJourney = (source: string, title: string, steps: Omit<JourneyStep, "state">[]) => {
        setJourney({ source, title, isFinished: false, startedAt: new Date().toISOString(), steps: steps.map((step, index) => ({ ...step, state: index === 0 ? "active" : "waiting" })) });
    };

    const journeyStorageKey = email ? `laco:document-journey:${email.trim().toLowerCase()}` : "";

    useEffect(() => {
        if (!journeyStorageKey) return;
        try {
            const saved = localStorage.getItem(journeyStorageKey);
            if (!saved) return;
            const restored = JSON.parse(saved) as Journey;
            const age = Date.now() - Date.parse(restored.startedAt);
            if (!restored.isFinished && Number.isFinite(age) && age < 60 * 60 * 1000) {
                restoredJourneyRef.current = true;
                setJourney((current) => current || { ...restored, restoredFromStorage: true });
            } else {
                localStorage.removeItem(journeyStorageKey);
            }
        } catch {
            localStorage.removeItem(journeyStorageKey);
        }
    }, [journeyStorageKey]);

    useEffect(() => {
        if (!journeyStorageKey || !journey) return;
        try {
            if (journey.isFinished) localStorage.removeItem(journeyStorageKey);
            else localStorage.setItem(journeyStorageKey, JSON.stringify(journey));
        } catch {
            // The server-side progress endpoint remains the recovery fallback.
        }
    }, [journey, journeyStorageKey]);

    useEffect(() => {
        let cancelled = false;
        const restoreJourney = async () => {
            let checkedStatus = false;
            try {
                const response = await fetch(api_link.storage.processing_status, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                const result = await response.json();
                if (response.ok && result?.success === true) checkedStatus = true;
                const active = (result?.progress ?? []).find((item: { processing_progress?: { status?: string } }) => item.processing_progress?.status === "processing");
                if (!response.ok || !active || cancelled) {
                    if (checkedStatus && !cancelled && restoredJourneyRef.current) {
                        setJourney((current) => {
                            if (!current?.restoredFromStorage) return current;
                            const activeIndex = current.steps.findIndex((step) => step.state === "active");
                            const errorIndex = Math.max(0, activeIndex);
                            const message = "This upload was interrupted before PDF processing began. Reselect the PDF to run its privacy check and continue.";
                            return {
                                ...current,
                                isFinished: true,
                                canRestart: true,
                                steps: current.steps.map((step, index) => index === errorIndex ? { ...step, state: "error", detail: message } : step),
                            };
                        });
                    }
                    return;
                }

                const progress = active.processing_progress;
                const activeIndex = progress.phase === "uploading" ? 0 : progress.phase === "generating_qa" ? 4 : progress.phase === "summarizing_pages" ? 3 : progress.phase === "reading_document" ? 2 : 1;
                const steps: Omit<JourneyStep, "state">[] = [
                    { label: "Uploading", detail: "Uploading your PDF…" },
                    { label: "Checking your PDF", detail: "Checking for sensitive information…" },
                    { label: "Reading the document", detail: "Extracting text from every PDF page…" },
                    { label: "Summarizing every PDF page", detail: "Analyzing page text and visuals…" },
                    { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
                    { label: "Ready to review", detail: "Your document is ready." },
                ];
                setJourney((current) => current || {
                    source: "PDF upload",
                    title: active.file_name || progress.file_name || "PDF processing",
                    startedAt: active.created_at || new Date().toISOString(),
                    isFinished: false,
                    steps: steps.map((step, index) => ({
                        ...step,
                        state: index < activeIndex ? "complete" : index === activeIndex ? "active" : "waiting",
                        ...(index === activeIndex ? { detail: progress.message || step.detail } : {}),
                    })),
                });
            } catch {
                // A failed recovery lookup should not prevent normal document use.
            }
        };
        void restoreJourney();
        return () => { cancelled = true; };
    }, [email]);

    const completeJourney = () => setJourney((current) => current && ({ ...current, isFinished: true, steps: current.steps.map((step) => ({ ...step, state: "complete" })) }));
    const failJourney = (message: string) => setJourney((current) => {
        if (!current) return current;
        const activeIndex = current.steps.findIndex((step) => step.state === "active");
        return { ...current, isFinished: true, steps: current.steps.map((step, index) => index === activeIndex ? { ...step, state: "error", detail: message } : step) };
    });

    useEffect(() => {
        if (!journey || journey.isFinished) return;
        const pollProgress = async () => {
            try {
                const response = await fetch(api_link.storage.processing_status, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, started_at: journey.startedAt }),
                });
                const result = await response.json();
                const progress = result?.progress?.[0]?.processing_progress;
                if (!response.ok || !progress) return;
                if (progress.status === "failed") {
                    failJourney(progress.message || "PDF processing failed.");
                    return;
                }

                const total = Number(progress.total_pages || 0);
                const currentPage = Number(progress.current_page || 0);
                const activeIndex = progress.phase === "generating_qa" ? 4 : progress.phase === "summarizing_pages" ? 3 : progress.phase === "reading_document" ? 2 : 1;
                const detail = progress.phase === "generating_qa"
                    ? `Generating questions and answers through page ${currentPage} of ${total}${progress.file_name ? ` · ${progress.file_name}` : ""}`
                    : progress.message || (progress.phase === "reading_document" ? `Reading PDF page ${currentPage} of ${total}` : `Summarizing PDF page ${currentPage} of ${total}`) + `${progress.file_name ? ` · ${progress.file_name}` : ""}`;
                setJourney((current) => current && !current.isFinished ? {
                    ...current,
                    steps: current.steps.map((step, index) => ({
                        ...step,
                        state: index < activeIndex ? "complete" : index === activeIndex ? "active" : "waiting",
                        ...(index === activeIndex ? { detail } : {}),
                    })),
                } : current);
            } catch {
                // The final upload response still reports failures if live progress is unavailable.
            }
        };
        void pollProgress();
        const timer = window.setInterval(pollProgress, 3000);
        return () => window.clearInterval(timer);
    }, [journey?.isFinished, journey?.startedAt, email]);

    const startPdfJourney = (files: File[]) => beginJourney("PDF upload", files.length === 1 ? files[0].name : `${files.length} PDF files`, [
        { label: "Uploading", detail: "Uploading your PDF…" },
        { label: "Checking your PDF", detail: "Checking for sensitive information…" },
        { label: "Reading the document", detail: "Extracting text from every PDF page…" },
        { label: "Summarizing every PDF page", detail: "Analyzing page text and visuals…" },
        { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
        { label: "Ready to review", detail: "Your document is ready." },
    ]);
    const startLinkJourney = (url: string) => beginJourney("Web link", url, [
        { label: "Opening the web page", detail: "Connecting to the page and finding readable content…" },
        { label: "Turning it into a PDF", detail: "Converting the page into a document…" },
        { label: "Summarizing every PDF page", detail: "Python is extracting and summarizing each page…" },
        { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
        { label: "Ready to review", detail: "Your web page is ready." },
    ]);

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

    const markUploadTransferred = () => setJourney((current) => current && !current.isFinished ? {
        ...current,
        steps: current.steps.map((step, index) => index === 0
            ? { ...step, state: "complete" }
            : index === 1
                ? { ...step, state: "active", detail: `Upload complete. ${step.label}…` }
                : { ...step, state: "waiting" }),
    } : current);

    const notifyHandlers = { onStart: showLoading, onSuccess: showSuccess, onError: showError, onUploadStart: startPdfJourney, onUploadTransferred: markUploadTransferred, onUploadSuccess: completeJourney, onUploadError: failJourney };

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
            {journey && <ProcessingJourney
                journey={journey}
                onDismiss={() => setJourney(null)}
                onRestart={() => {
                    try { if (journeyStorageKey) localStorage.removeItem(journeyStorageKey); } catch { /* Ignore unavailable browser storage. */ }
                    setJourney(null);
                    pdfDialogOpenerRef.current?.();
                }}
                onCancel={() => {
                    const aborted = publicDocs.cancelUpload();
                    void publicDocs.deleteIncompleteUploads(journey.startedAt);
                    if (!aborted) {
                        try { if (journeyStorageKey) localStorage.removeItem(journeyStorageKey); } catch { /* Ignore unavailable browser storage. */ }
                        setJourney(null);
                    }
                }}
            />}
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
                    email={email}
                    table={publicDocs}
                    pdfDialogOpenerRef={pdfDialogOpenerRef}
                    onLinkJourneyStart={startLinkJourney}
                    onLinkJourneySuccess={completeJourney}
                    onLinkJourneyError={failJourney}
                />
            </div>
        </section>
    );
}
