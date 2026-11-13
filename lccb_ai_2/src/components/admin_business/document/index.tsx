"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to, Popup_info, SweetAlert2 } from "@/utilities";
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

const MagicIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m15 4 5 5M4 20l7.5-7.5M13 3l1.5 3L18 7.5l-3.5 1.5L13 12l-1.5-3L8 7.5 11.5 6 13 3Z" />
        <path d="m5 13 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
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
    onLinkJourneyStart: (url: string) => void;
    onLinkJourneySuccess: () => void;
    onLinkJourneyError: (message: string) => void;
}

type JourneyStep = { label: string; detail: string; state: "waiting" | "active" | "complete" | "error" };
type Journey = { title: string; source: string; steps: JourneyStep[]; isFinished: boolean; startedAt: string };

function ProcessingJourney({ journey, onDismiss }: { journey: Journey; onDismiss: () => void }) {
    const activeStep = journey.steps.find((step) => step.state === "active" || step.state === "error");
    return (
        <aside className={styles.processingJourney} role="status" aria-live="polite">
            <div className={styles.journeyHeader}>
                <div>
                    <span className={styles.journeyEyebrow}>{journey.source}</span>
                    <h3>{journey.title}</h3>
                </div>
                {journey.isFinished && <button className={styles.journeyClose} onClick={onDismiss} aria-label="Dismiss progress notification">&times;</button>}
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

type QuestionAnswer = { question: string; answer: string; page?: number };

function parseQuestionAnswers(summary?: string): QuestionAnswer[] {
    if (!summary) return [];
    try {
        const parsed: unknown = JSON.parse(summary.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is QuestionAnswer => Boolean(item) && typeof item.question === "string" && typeof item.answer === "string")
            .map(({ question, answer, page }) => ({ question, answer, ...(Number.isInteger(page) ? { page } : {}) }));
    } catch {
        return [];
    }
}

function DocumentTableSection({ title, description, sensitive, email, table, onLinkJourneyStart, onLinkJourneySuccess, onLinkJourneyError }: DocumentTableSectionProps) {
    const {
        fileRef, data, search, setSearch, page, setPage, totalPages,
        isLoading, refresh, setRefresh, triggerUpload, handleFile, handleFiles,
        downloadFile, deleteFile, deleteSelected,
        selectedIds, toggleSelect, toggleSelectAll,
    } = table;

    const [viewingDoc, setViewingDoc] = useState<DocFile | null>(null);
    const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [generatingAnswerIndex, setGeneratingAnswerIndex] = useState<number | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [webLink, setWebLink] = useState("");
    const [isUploadingLink, setIsUploadingLink] = useState(false);

    const openReview = (doc: DocFile) => {
        setViewingDoc(doc);
        setQuestionsAndAnswers(parseQuestionAnswers(doc.summary));
    };

    const closeReview = () => {
        if (isSaving) return;
        setViewingDoc(null);
        setQuestionsAndAnswers([]);
    };

    const updateQuestionAnswer = (index: number, field: keyof QuestionAnswer, value: string) => {
        setQuestionsAndAnswers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    };

    const saveQuestionAnswers = async () => {
        if (!viewingDoc?.id || questionsAndAnswers.length === 0) return;
        setIsSaving(true);
        const response = await Fetch_to(api_link.storage.update_chatbot_questions, { id: viewingDoc.id, email, questionsAndAnswers });
        setIsSaving(false);
        if (!response.success) {
            await SweetAlert2("Unable to save", response.message || "Please try again.", "error", true, "OK", false, "");
            return;
        }
        setRefresh(true);
        closeReview();
    };

    const generateQuestions = async () => {
        if (!viewingDoc?.id) return;
        setIsGeneratingQuestions(true);
        const response = await Fetch_to(api_link.storage.generate_chatbot_qa, { id: viewingDoc.id, email, action: "questions" });
        setIsGeneratingQuestions(false);
        if (!response.success || !Array.isArray(response.data?.questions)) {
            await SweetAlert2("Unable to generate questions", response.message || "Please try again.", "error", true, "OK", false, "");
            return;
        }
        setQuestionsAndAnswers(response.data.questions.map((item: unknown) => {
            if (typeof item === "string") return { question: item, answer: "" };
            if (!item || typeof item !== "object") return { question: "", answer: "" };
            const generated = item as { question?: unknown; answer?: unknown; page?: unknown };
            return {
                question: typeof generated.question === "string" ? generated.question : "",
                answer: typeof generated.answer === "string" ? generated.answer : "",
                ...(Number.isInteger(generated.page) ? { page: generated.page as number } : {}),
            };
        }));
    };

    const generateAnswer = async (index: number) => {
        if (!viewingDoc?.id || !questionsAndAnswers[index]?.question.trim()) return;
        setGeneratingAnswerIndex(index);
        const response = await Fetch_to(api_link.storage.generate_chatbot_qa, { id: viewingDoc.id, email, action: "answer", question: questionsAndAnswers[index].question });
        setGeneratingAnswerIndex(null);
        if (!response.success || typeof response.data?.answer !== "string") {
            await SweetAlert2("Unable to generate answer", response.message || "Please try again.", "error", true, "OK", false, "");
            return;
        }
        updateQuestionAnswer(index, "answer", response.data.answer);
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
                onChange={(event) => { handleFile(event); setIsPdfDialogOpen(false); setIsDragging(false); }}
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
                                        <button className={styles.button_view} title="Review questions and answers" onClick={() => openReview(doc)}>
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

            {viewingDoc && (
                <div className={`${styles.modalOverlay} ${questionsAndAnswers.length > 0 ? styles.reviewOverlay : ""}`} onClick={closeReview}>
                    <div className={`${styles.modalCard} ${questionsAndAnswers.length > 0 ? styles.reviewCard : ""}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{viewingDoc.file_name}</h3>
                            <button className={styles.modalClose} onClick={closeReview}>
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {questionsAndAnswers.length > 0 ? (
                                <div className={styles.qaEditor}>
                                    <p className={styles.qaHelp}>Review the generated content before making it available to your chatbot.</p>
                                    {questionsAndAnswers.map((item, index) => (
                                        <div className={styles.qaRow} key={index}>
                                            <label>Question {index + 1}{item.page ? ` · Page ${item.page}` : ""}</label>
                                            <input value={item.question} onChange={(event) => updateQuestionAnswer(index, "question", event.target.value)} />
                                            <span className={styles.answerLabel}><label>Answer</label><button className={styles.magicButton} title="Generate answer" aria-label={`Generate answer for question ${index + 1}`} onClick={() => generateAnswer(index)} disabled={isSaving || isGeneratingQuestions || generatingAnswerIndex !== null || !item.question.trim()}>{generatingAnswerIndex === index ? "..." : <MagicIcon />}</button></span>
                                            <textarea value={item.answer} onChange={(event) => updateQuestionAnswer(index, "answer", event.target.value)} rows={5} />
                                            <button className={styles.removeQuestion} onClick={() => setQuestionsAndAnswers((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={questionsAndAnswers.length === 1 || isSaving}>Remove</button>
                                        </div>
                                    ))}
                                    <div className={styles.qaActions}>
                                        <button className={styles.addQuestion} onClick={() => setQuestionsAndAnswers((current) => [...current, { question: "", answer: "" }])} disabled={isSaving || isGeneratingQuestions}>Add question</button>
                                        <button className={styles.generateQuestions} onClick={generateQuestions} disabled={isSaving || isGeneratingQuestions || generatingAnswerIndex !== null}>{isGeneratingQuestions ? "Generating questions..." : "Generate questions"}</button>
                                    </div>
                                </div>
                            ) : <Markdown remarkPlugins={[remarkGfm]}>{viewingDoc.summary || "No summary available."}</Markdown>}
                        </div>
                        <div className={styles.modalFooter}>
                            {questionsAndAnswers.length > 0 && <button className={styles.button_upload} onClick={saveQuestionAnswers} disabled={isSaving}>{isSaving ? "Saving..." : "Save questions and answers"}</button>}
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
            {isAddDialogOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAddDialogOpen(false)}>
                    <div className={styles.addDialog} role="dialog" aria-modal="true" aria-labelledby="add-document-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div><span className={styles.dialogEyebrow}>ADD TO YOUR LIBRARY</span><h3 id="add-document-title">Add document</h3></div>
                            <button className={styles.modalClose} onClick={() => setIsAddDialogOpen(false)} aria-label="Close">&times;</button>
                        </div>
                        <p className={styles.addDialogIntro}>Choose how you’d like to add content to {sensitive ? "your sensitive documents" : "your library"}.</p>
                        <div className={styles.addChoices}>
                            <button className={styles.addChoice} onClick={() => { setIsAddDialogOpen(false); setIsPdfDialogOpen(true); }}>
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
                <div className={styles.modalOverlay} onClick={() => { setIsPdfDialogOpen(false); setIsDragging(false); }}>
                    <div className={styles.pdfDialog} role="dialog" aria-modal="true" aria-labelledby="upload-pdf-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div><span className={styles.dialogEyebrow}>UPLOAD DOCUMENT</span><h3 id="upload-pdf-title">Upload a PDF</h3></div>
                            <button className={styles.modalClose} onClick={() => { setIsPdfDialogOpen(false); setIsDragging(false); }} aria-label="Close">&times;</button>
                        </div>
                        <div className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void handleFiles(Array.from(event.dataTransfer.files)); setIsPdfDialogOpen(false); }}>
                            <span className={styles.uploadIcon} aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 32V8m0 0-9 9m9-9 9 9M10 28v10a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                            <strong>Drag and drop your PDF here</strong>
                            <span className={styles.dropHint}>or choose a file from your device</span>
                            <button className={styles.browseButton} onClick={triggerUpload}>Browse files</button>
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

    const beginJourney = (source: string, title: string, steps: Omit<JourneyStep, "state">[]) => {
        setJourney({ source, title, isFinished: false, startedAt: new Date().toISOString(), steps: steps.map((step, index) => ({ ...step, state: index === 0 ? "active" : "waiting" })) });
    };
    const completeJourney = () => setJourney((current) => current && ({ ...current, isFinished: true, steps: current.steps.map((step) => ({ ...step, state: "complete" })) }));
    const failJourney = (message: string) => setJourney((current) => {
        if (!current) return current;
        const activeIndex = current.steps.findIndex((step) => step.state === "active");
        return { ...current, isFinished: true, steps: current.steps.map((step, index) => index === activeIndex ? { ...step, state: "error", detail: message } : step) };
    });

    useEffect(() => {
        if (!journey || journey.isFinished) return;
        const timer = window.setInterval(() => {
            setJourney((current) => {
                if (!current || current.isFinished) return current;
                const activeIndex = current.steps.findIndex((step) => step.state === "active");
                if (activeIndex < 0 || activeIndex >= 2) return current;
                return { ...current, steps: current.steps.map((step, index) => index === activeIndex ? { ...step, state: "complete" } : index === activeIndex + 1 ? { ...step, state: "active" } : step) };
            });
        }, 2800);
        return () => window.clearInterval(timer);
    }, [journey?.isFinished, journey?.source, journey?.title]);

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
                const activeIndex = progress.phase === "generating_qa" ? 3 : 2;
                const detail = progress.phase === "generating_qa"
                    ? `Generating questions and answers through page ${currentPage} of ${total}${progress.file_name ? ` · ${progress.file_name}` : ""}`
                    : progress.message || `Summarizing PDF page ${currentPage} of ${total}${progress.file_name ? ` · ${progress.file_name}` : ""}`;
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
        { label: "Uploading your PDF", detail: "Sending your document securely…" },
        { label: "Reading the document", detail: "Extracting text from your PDF…" },
        { label: "Summarizing every PDF page", detail: "Python is extracting and summarizing each page…" },
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

    const notifyHandlers = { onStart: showLoading, onSuccess: showSuccess, onError: showError, onUploadStart: startPdfJourney, onUploadSuccess: completeJourney, onUploadError: failJourney };

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
            {journey && <ProcessingJourney journey={journey} onDismiss={() => setJourney(null)} />}
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
                    onLinkJourneyStart={startLinkJourney}
                    onLinkJourneySuccess={completeJourney}
                    onLinkJourneyError={failJourney}
                />
            </div>
        </section>
    );
}
