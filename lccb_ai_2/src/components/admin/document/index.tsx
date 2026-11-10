"use client";
import styles from "./css/styles.module.css";
import { useCallback, useEffect, useState } from "react";
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
                        <span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} />
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
    email: string;
    table: ReturnType<typeof useDocumentTable>;
    onLinkJourneyStart: (url: string) => void;
    onLinkJourneySuccess: () => void;
    onLinkJourneyError: (message: string) => void;
}

type JourneyStep = { label: string; detail: string; state: "waiting" | "active" | "complete" | "error" };
type Journey = { title: string; source: string; steps: JourneyStep[]; isFinished: boolean; startedAt: string; sensitive?: boolean; result?: string };

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
            <p className={`${styles.journeyStatus} ${journey.result?.includes("Skipped ") ? styles.journeyResultWarning : ""}`}>{activeStep ? activeStep.detail : journey.result || "Everything is ready."}</p>
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

type StudentShelfEntry = {
    email: string;
    school_id: string | null;
    name: string;
    record_count: number;
    document_count: number;
    latest_at: string;
};

type StudentRecordSource = {
    id: number;
    created_at: string;
    source_file_name: string;
    page_numbers: number[];
    record_count: number;
    records: Array<{ page: number; student_name: string | null; data: Record<string, unknown> }>;
};

function formatRecordLabel(label: string) {
    return label.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function RecordValue({ value }: { value: unknown }) {
    if (value === null || value === undefined || value === "") return <span>—</span>;
    if (Array.isArray(value)) {
        if (value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item))) {
            return <ul className={styles.recordValueList}>{value.map((item, index) => <li key={index}>{item === null ? "—" : String(item)}</li>)}</ul>;
        }
        return (
            <div className={styles.recordValueCards}>
                {value.map((item, index) => (
                    <div className={styles.recordValueCard} key={index}>
                        {item && typeof item === "object" && !Array.isArray(item) ? (
                            <dl className={styles.recordValueDetails}>
                                {Object.entries(item as Record<string, unknown>).map(([label, nestedValue]) => (
                                    <div key={label}><dt>{formatRecordLabel(label)}</dt><dd><RecordValue value={nestedValue} /></dd></div>
                                ))}
                            </dl>
                        ) : <RecordValue value={item} />}
                    </div>
                ))}
            </div>
        );
    }
    if (typeof value === "object") {
        return (
            <dl className={styles.recordValueDetails}>
                {Object.entries(value as Record<string, unknown>).map(([label, nestedValue]) => (
                    <div key={label}><dt>{formatRecordLabel(label)}</dt><dd><RecordValue value={nestedValue} /></dd></div>
                ))}
            </dl>
        );
    }
    return <span>{String(value)}</span>;
}

function StudentRecordsBookshelf({ email }: { email: string }) {
    const [students, setStudents] = useState<StudentShelfEntry[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<StudentShelfEntry | null>(null);
    const [studentRecords, setStudentRecords] = useState<StudentRecordSource[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);

    const refreshStudents = useCallback(async () => {
        setIsLoading(true);
        setError("");
        const response = await Fetch_to(api_link.storage.student_records, { email });
        if (response.success && Array.isArray(response.data?.students)) setStudents(response.data.students);
        else setError(response.message || "Could not load the student records shelf.");
        setIsLoading(false);
    }, [email]);

    useEffect(() => { void refreshStudents(); }, [refreshStudents]);
    useEffect(() => {
        const handleRecordsUpdated = () => { void refreshStudents(); };
        window.addEventListener("student-records-updated", handleRecordsUpdated);
        return () => window.removeEventListener("student-records-updated", handleRecordsUpdated);
    }, [refreshStudents]);

    const openStudent = async (student: StudentShelfEntry) => {
        setSelectedStudent(student);
        setIsLoadingRecords(true);
        setError("");
        const response = await Fetch_to(api_link.storage.student_records, { email, student_email: student.email });
        if (response.success && Array.isArray(response.data?.records)) setStudentRecords(response.data.records);
        else setError(response.message || "Could not load this student's records.");
        setIsLoadingRecords(false);
    };

    const filteredStudents = students.filter((student) => `${student.name} ${student.school_id ?? ""} ${student.email}`.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <section className={styles.studentShelf}>
            <div className={styles.shelfHeader}>
                <div><span className={styles.shelfEyebrow}>SENSITIVE RECORDS</span><h2>Student bookshelf</h2><p>Academic records are grouped by verified student ID.</p></div>
                <button className={styles.shelfRefresh} onClick={() => void refreshStudents()} disabled={isLoading}>Refresh</button>
            </div>
            <input className={styles.shelfSearch} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student name, ID, or email" />
            {error && <p className={styles.shelfError} role="alert">{error}</p>}
            {isLoading ? <p className={styles.shelfEmpty}>Loading student records…</p> : filteredStudents.length ? (
                <div className={styles.studentBooks}>
                    {filteredStudents.map((student) => (
                        <button className={styles.studentBook} key={student.email} onClick={() => void openStudent(student)}>
                            <span className={styles.bookIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" stroke="currentColor" strokeWidth="1.8"/><path d="M4 6h13M8 9h8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
                            <strong>{student.name}</strong>
                            <span className={styles.studentBookId}>{student.school_id || "Student ID unavailable"}</span>
                            <span className={styles.studentBookMeta}>{student.record_count} record{student.record_count === 1 ? "" : "s"} · {student.document_count} document{student.document_count === 1 ? "" : "s"}</span>
                        </button>
                    ))}
                </div>
            ) : <p className={styles.shelfEmpty}>No matched student records yet. Records without a registered Student ID are skipped.</p>}

            {selectedStudent && (
                <div className={styles.modalOverlay} onClick={() => { setSelectedStudent(null); setStudentRecords([]); }}>
                    <section className={styles.studentRecordModal} role="dialog" aria-modal="true" aria-labelledby="student-record-title" onClick={(event) => event.stopPropagation()}>
                        <header className={styles.studentRecordHeader}>
                            <div><span className={styles.shelfEyebrow}>STUDENT RECORDS</span><h2 id="student-record-title">{selectedStudent.name}</h2><p>{selectedStudent.school_id || selectedStudent.email}</p></div>
                            <button className={styles.modalClose} onClick={() => { setSelectedStudent(null); setStudentRecords([]); }} aria-label="Close student records">&times;</button>
                        </header>
                        <div className={styles.studentRecordBody}>
                            {isLoadingRecords ? <p className={styles.shelfEmpty}>Decrypting records…</p> : studentRecords.length ? studentRecords.map((source) => (
                                <article className={styles.recordSource} key={source.id}>
                                    <div className={styles.recordSourceHeader}><div><strong>{source.source_file_name}</strong><span>Pages {source.page_numbers.join(", ") || "—"} · {source.record_count} entries</span></div><time>{new Date(source.created_at).toLocaleDateString()}</time></div>
                                    {source.records.map((record, index) => (
                                        <div className={styles.extractedRecord} key={`${source.id}-${index}`}>
                                            <span className={styles.recordPage}>Page {record.page}{record.student_name ? ` · ${record.student_name}` : ""}</span>
                                            <dl className={styles.extractedRecordDetails}>{Object.entries(record.data).map(([label, value]) => <div key={label}><dt>{formatRecordLabel(label)}</dt><dd><RecordValue value={value} /></dd></div>)}</dl>
                                        </div>
                                    ))}
                                </article>
                            )) : <p className={styles.shelfEmpty}>No stored records for this student.</p>}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

function parseQuestionAnswers(summary?: string): QuestionAnswer[] {
    if (!summary) return [];
    try {
        const parsed: unknown = JSON.parse(summary.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item): item is QuestionAnswer => Boolean(item) && typeof item.question === "string" && typeof item.answer === "string")
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
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [webLink, setWebLink] = useState("");
    const [isUploadingLink, setIsUploadingLink] = useState(false);
    const [isRechecking, setIsRechecking] = useState(false);

    const recheckSensitivePdfs = async () => {
        if (!sensitive || isRechecking) return;
        setIsRechecking(true);
        try {
            const response = await Fetch_to(api_link.storage.recheck_sensitive_records, { email });
            if (!response.success) {
                await SweetAlert2("Could not recheck PDFs", response.message || "Please try again.", "error", true, "OK", false, "");
                return;
            }
            setRefresh(true);
            window.dispatchEvent(new Event("student-records-updated"));
            const failed = Array.isArray(response.data?.outcomes)
                ? response.data.outcomes.filter((item: { success?: boolean }) => !item.success).length
                : 0;
            const details = Array.isArray(response.data?.outcomes)
                ? response.data.outcomes.filter((item: { message?: string }) => item.message).map((item: { file_name?: string; message?: string }) => `${item.file_name || "PDF"}: ${item.message}`).join(" ")
                : "";
            const message = `${response.data?.message || response.message || "PDFs rechecked."}${failed ? ` ${failed} PDF(s) could not be rechecked.` : ""}${details ? ` ${details}` : ""}`;
            await SweetAlert2("PDF recheck complete", message, failed ? "warning" : "success", true, "OK", false, "");
        } catch {
            await SweetAlert2("Could not recheck PDFs", "Please try again.", "error", true, "OK", false, "");
        } finally {
            setIsRechecking(false);
        }
    };

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
        const response = await Fetch_to(api_link.storage.update_chatbot_questions, {
            id: viewingDoc.id,
            email,
            questionsAndAnswers,
        });
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
        const response = await Fetch_to(api_link.storage.generate_chatbot_qa, {
            id: viewingDoc.id,
            email,
            action: "questions",
        });
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
        const response = await Fetch_to(api_link.storage.generate_chatbot_qa, {
            id: viewingDoc.id,
            email,
            action: "answer",
            question: questionsAndAnswers[index].question,
        });
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
                    {sensitive && <button className={styles.button_upload} onClick={recheckSensitivePdfs} disabled={isRechecking}>
                        {isRechecking ? "Checking PDFs…" : "Check all PDFs"}
                    </button>}
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
                    if (event.target.files?.length) setIsPdfDialogOpen(false);
                    handleFile(event);
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
                                    <td>
                                        {!sensitive && <button className={styles.button_view} title="Review questions and answers" onClick={() => openReview(doc)}>
                                            <ViewIcon />
                                        </button>}
                                        <button className={styles.button_delete} title="Delete PDF" onClick={() => handleDeleteFile(doc)}>
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
                            <div className={styles.reviewHeading}>
                                <span className={styles.reviewFileBadge}>PDF</span>
                                <span className={styles.reviewTitleText}>
                                    <span className={styles.reviewEyebrow}>DOCUMENT REVIEW</span>
                                    <h3>{viewingDoc.file_name}</h3>
                                </span>
                            </div>
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
                            ) : (
                                <Markdown remarkPlugins={[remarkGfm]}>{viewingDoc.summary || "No summary available."}</Markdown>
                            )}
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
                            <div><span className={styles.dialogEyebrow}>DOCUMENT LIBRARY</span><h3 id="add-document-title">Add a document</h3></div>
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
                        <div className={styles.modalHeader}>
                            <h3>Add a web page</h3>
                            <button className={styles.modalClose} disabled={isUploadingLink} onClick={() => setIsLinkDialogOpen(false)}>&times;</button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>We will convert the readable web-page content into a PDF, then process it exactly like an uploaded PDF.</p>
                            <input className={styles.linkInput} type="url" placeholder="https://example.com/page" value={webLink} onChange={(event) => setWebLink(event.target.value)} disabled={isUploadingLink} />
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.button_upload} onClick={uploadWebLink} disabled={isUploadingLink || !webLink.trim()}>{isUploadingLink ? "Converting and generating..." : "Convert web page to PDF"}</button>
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
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");
    const [journey, setJourney] = useState<Journey | null>(null);

    const beginJourney = (source: string, title: string, steps: Omit<JourneyStep, "state">[], sensitive = false) => {
        setJourney({
            source,
            title,
            isFinished: false,
            startedAt: new Date().toISOString(),
            sensitive,
            steps: steps.map((step, index) => ({ ...step, state: index === 0 ? "active" : "waiting" })),
        });
    };

    const completeJourney = (result?: string) => setJourney((current) => current && {
        ...current,
        isFinished: true,
        result,
        steps: current.steps.map((step) => ({ ...step, state: "complete" })),
    });

    const failJourney = (message: string) => setJourney((current) => {
        if (!current) return current;
        const activeIndex = current.steps.findIndex((step) => step.state === "active");
        return {
            ...current,
            isFinished: true,
            steps: current.steps.map((step, index) => index === activeIndex ? { ...step, state: "error", detail: message } : step),
        };
    });

    // Advance the initial upload/read stages; Python reports the page-processing stage below.
    useEffect(() => {
        if (!journey || journey.isFinished) return;
        const timer = window.setInterval(() => {
            setJourney((current) => {
                if (!current || current.isFinished) return current;
                const activeIndex = current.steps.findIndex((step) => step.state === "active");
                if (activeIndex < 0 || activeIndex >= 2) return current;
                return {
                    ...current,
                    steps: current.steps.map((step, index) => (
                        index === activeIndex ? { ...step, state: "complete" } :
                        index === activeIndex + 1 ? { ...step, state: "active" } : step
                    )),
                };
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
                    body: JSON.stringify({ email, started_at: journey.startedAt, sensitive: journey.sensitive }),
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
                const activeIndex = journey.sensitive ? 2 : progress.phase === "generating_qa" ? 3 : 2;
                const detail = journey.sensitive
                    ? progress.message || `Matching records on page ${currentPage} of ${total}${progress.file_name ? ` · ${progress.file_name}` : ""}`
                    : progress.phase === "generating_qa"
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
    }, [journey?.isFinished, journey?.startedAt, journey?.sensitive, email]);

    const startPdfJourney = (files: File[]) => beginJourney(
        "PDF upload",
        files.length === 1 ? files[0].name : `${files.length} PDF files`,
        [
            { label: "Uploading your PDF", detail: "Sending your document securely…" },
            { label: "Reading the document", detail: "Extracting text from your PDF…" },
            { label: "Summarizing every PDF page", detail: "Python is extracting and summarizing each page…" },
            { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
            { label: "Ready to review", detail: "Your document is ready." },
        ],
    );

    const startSensitivePdfJourney = (files: File[]) => beginJourney(
        "Sensitive PDF",
        files.length === 1 ? files[0].name : `${files.length} PDF files`,
        [
            { label: "Uploading the private PDF", detail: "Storing your document securely…" },
            { label: "Reading the document", detail: "Extracting records page by page…" },
            { label: "Matching student IDs", detail: "Checking records against registered student IDs…" },
            { label: "Saving matched records", detail: "Encrypting records into each student’s bookshelf…" },
            { label: "Ready", detail: "Sensitive document processing is complete." },
        ],
        true,
    );

    const startLinkJourney = (url: string) => beginJourney(
        "Web link",
        url,
        [
            { label: "Opening the web page", detail: "Connecting to the page and finding readable content…" },
            { label: "Turning it into a PDF", detail: "Converting the page into a document…" },
            { label: "Summarizing every PDF page", detail: "Python is extracting and summarizing each page…" },
            { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
            { label: "Ready to review", detail: "Your web page is ready." },
        ],
    );

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

    const notifyHandlers = {
        onStart: showLoading,
        onSuccess: showSuccess,
        onError: showError,
        onUploadStart: startPdfJourney,
        onUploadSuccess: (message?: string) => completeJourney(message),
        onUploadError: failJourney,
    };

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

    const sensitiveNotifyHandlers = {
        ...notifyHandlers,
        onUploadStart: startSensitivePdfJourney,
        onUploadSuccess: (message?: string) => {
            completeJourney(message);
            window.dispatchEvent(new Event("student-records-updated"));
        },
    };
    const sensitiveDocs = useDocumentTable(
        {
            retrieve: api_link.storage.retrieve_sensitive,
            upload: api_link.storage.uploadpdf_sensitive,
            download: api_link.storage.downloadpdf_sensitive,
            delete: api_link.storage.deletepdf_sensitive,
        },
        email,
        sensitiveNotifyHandlers
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

                <DocumentTableSection
                    title="Sensitive Documents"
                    description="Restricted documents such as student grades. Not exposed to general chatbot queries."
                    sensitive
                    email={email}
                    table={sensitiveDocs}
                    onLinkJourneyStart={startLinkJourney}
                    onLinkJourneySuccess={completeJourney}
                    onLinkJourneyError={failJourney}
                />
            </div>
            <StudentRecordsBookshelf email={email} />
        </section>
    );
}
