"use client";
import styles from "./css/styles.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to, Popup_info, SweetAlert2 } from "@/utilities";
import { type DocFile, type PrivacyWarning, useDocumentTable } from "@/modules/documents/useDocumentTable";
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
    pdfDialogOpenerRef: { current: (() => void) | null };
    onLinkJourneyStart: (url: string) => void;
    onLinkJourneySuccess: () => void;
    onLinkJourneyError: (message: string) => void;
}

type JourneyStep = { label: string; detail: string; state: "waiting" | "active" | "complete" | "error" };
type JourneyFileResult = { name: string; status: string; detail: string; sensitive?: boolean };
type SensitiveRecheckOutcome = { file_name?: string; success?: boolean; newly_matched_students?: number; message?: string };
type UploadResultDetails = { uploaded?: Array<Record<string, unknown>>; privacyScan?: Array<Record<string, unknown>> };
type Journey = { title: string; source: string; steps: JourneyStep[]; isFinished: boolean; startedAt: string; sensitive?: boolean; result?: string; files?: JourneyFileResult[]; canRestart?: boolean; restoredFromStorage?: boolean };

function PrivacyReviewDialog({ warnings, onCancel, onContinue, restored = false }: { warnings: PrivacyWarning[]; onCancel: () => void; onContinue: () => void; restored?: boolean }) {
    return (
        <div className={`${styles.modalOverlay} ${styles.privacyReviewOverlay}`}>
            <section className={styles.privacyReviewDialog} role="dialog" aria-modal="true" aria-labelledby="privacy-review-title">
                <header className={styles.privacyReviewHeader}>
                    <span className={styles.privacyReviewEyebrow}>PUBLIC DOCUMENTS · PRIVACY REVIEW</span>
                    <h2 id="privacy-review-title">Possible sensitive information detected</h2>
                    <p>{restored ? "This privacy scan finished before the page was reloaded. Select the PDFs again to rescan and continue." : "Review the scan results before adding these PDFs to the public library."}</p>
                </header>
                <div className={styles.privacyReviewBody}>
                    <div className={styles.privacyReviewNotice}>
                        Public Documents may be used by the chatbot to answer visitor questions. This automated scan can miss information, so review the original PDFs too.
                    </div>
                    <h3>Flagged PDFs ({warnings.length})</h3>
                    <ul className={styles.privacyWarningList}>
                        {warnings.map((warning, index) => (
                            <li key={`${warning.fileName || "pdf"}-${index}`}>
                                <strong>{warning.fileName || "PDF"}</strong>
                                {warning.findings?.length ? (
                                    <ul>{warning.findings.map((finding, findingIndex) => {
                                        const category = typeof finding.category === "string" ? finding.category.replaceAll("_", " ") : "Sensitive information";
                                        const pages = Array.isArray(finding.pages) && finding.pages.length ? finding.pages.join(", ") : "not specified";
                                        return <li key={`${category}-${findingIndex}`}><span>{category}</span><small>Page{finding.pages?.length === 1 ? "" : "s"}: {pages}</small></li>;
                                    })}</ul>
                                ) : <p>The scan flagged this PDF but did not return category or page details.</p>}
                            </li>
                        ))}
                    </ul>
                    <p className={styles.privacyReviewFootnote}>Continue only if you are authorized to process the information and have reviewed whether it belongs in a public document library.</p>
                </div>
                <footer className={styles.privacyReviewFooter}>
                    <button type="button" className={styles.privacyReviewCancel} onClick={onCancel}>Cancel upload</button>
                    <button type="button" className={styles.privacyReviewContinue} onClick={onContinue}>{restored ? "Reselect PDFs to continue" : "Continue to upload"}</button>
                </footer>
            </section>
        </div>
    );
}

function ProcessingJourney({ journey, onDismiss, onCancel, onRestart }: { journey: Journey; onDismiss: () => void; onCancel: () => void; onRestart: () => void }) {
    const activeStep = journey.steps.find((step) => step.state === "active" || step.state === "error");
    return (
        <div className={styles.journeyOverlay}>
        <section className={styles.processingJourney} role="dialog" aria-modal="true" aria-labelledby="processing-journey-title" aria-live="polite">
            <div className={styles.journeyHeader}>
                <div>
                    <span className={styles.journeyEyebrow}>{journey.source}</span>
                    <h3 id="processing-journey-title">{journey.title}</h3>
                </div>
                {journey.canRestart
                    ? <button className={styles.journeyCancel} onClick={onRestart}>Reselect PDFs</button>
                    : journey.isFinished
                    ? <button className={styles.journeyClose} onClick={onDismiss} aria-label="Dismiss progress notification">&times;</button>
                    : journey.source !== "Web link" && journey.source !== "Sensitive PDF recheck" && <button className={styles.journeyCancel} onClick={onCancel}>Cancel upload</button>}
            </div>
            <p className={`${styles.journeyStatus} ${journey.result?.includes("Skipped ") ? styles.journeyResultWarning : ""}`}>{activeStep ? activeStep.detail : journey.result || "Everything is ready."}</p>
            <ol className={styles.journeySteps}>
                {journey.steps.map((step, index) => (
                    <li key={step.label} className={`${styles.journeyStep} ${styles[`journey${step.state[0].toUpperCase()}${step.state.slice(1)}`]}`}>
                        <span className={styles.journeyMarker}>{step.state === "complete" ? "✓" : step.state === "error" ? "!" : index + 1}</span>
                        <span className={styles.journeyStepText}><strong>{step.label}</strong>{step.state === "active" && <small>{step.detail}</small>}</span>
                    </li>
                ))}
            </ol>
            {journey.isFinished && Boolean(journey.files?.length) && (
                <section className={styles.journeyFiles} aria-label="Per-PDF processing results">
                    <h4>{journey.sensitive ? "Record matching results" : "AI privacy scan results"}</h4>
                    <ul>{journey.files?.map((file, index) => (
                        <li key={`${file.name}-${index}`} className={file.sensitive ? styles.journeyFileSensitive : ""}>
                            <span className={styles.journeyFileIcon}>{file.sensitive ? "!" : "✓"}</span>
                            <span><strong>{file.name}</strong><small>{file.status}</small>{file.detail && <small>{file.detail}</small>}</span>
                        </li>
                    ))}</ul>
                </section>
            )}
        </section>
        </div>
    );
}

type StudentShelfEntry = {
    email: string;
    school_id: string | null;
    name: string;
    role: string;
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
        else setError(response.message || "Could not load the sensitive records shelf.");
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
        else setError(response.message || "Could not load this person's records.");
        setIsLoadingRecords(false);
    };

    const filteredStudents = students.filter((student) => `${student.name} ${student.school_id ?? ""} ${student.email}`.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <section className={styles.studentShelf}>
            <div className={styles.shelfHeader}>
                <div><span className={styles.shelfEyebrow}>SENSITIVE RECORDS</span><h2>Student and teacher records</h2><p>Private school records are grouped by each person&apos;s verified school ID.</p></div>
                <button className={styles.shelfRefresh} onClick={() => void refreshStudents()} disabled={isLoading}>Refresh</button>
            </div>
            <input className={styles.shelfSearch} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, school ID, or email" />
            {error && <p className={styles.shelfError} role="alert">{error}</p>}
            {isLoading ? <p className={styles.shelfEmpty}>Loading sensitive records…</p> : filteredStudents.length ? (
                <div className={styles.studentBooks}>
                    {filteredStudents.map((student) => (
                        <button className={styles.studentBook} key={student.email} onClick={() => void openStudent(student)}>
                            <span className={styles.bookIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" stroke="currentColor" strokeWidth="1.8"/><path d="M4 6h13M8 9h8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
                            <strong>{student.name}</strong>
                            <span className={styles.studentBookId}>{student.role} · {student.school_id || "School ID unavailable"}</span>
                            <span className={styles.studentBookMeta}>{student.record_count} record{student.record_count === 1 ? "" : "s"} · {student.document_count} document{student.document_count === 1 ? "" : "s"}</span>
                        </button>
                    ))}
                </div>
            ) : <p className={styles.shelfEmpty}>No matched student or teacher records yet. Records without a registered school ID are skipped.</p>}

            {selectedStudent && (
                <div className={styles.modalOverlay} onClick={() => { setSelectedStudent(null); setStudentRecords([]); }}>
                    <section className={styles.studentRecordModal} role="dialog" aria-modal="true" aria-labelledby="student-record-title" onClick={(event) => event.stopPropagation()}>
                        <header className={styles.studentRecordHeader}>
                            <div><span className={styles.shelfEyebrow}>{selectedStudent.role.toUpperCase()} RECORDS</span><h2 id="student-record-title">{selectedStudent.name}</h2><p>{selectedStudent.school_id || selectedStudent.email}</p></div>
                            <button className={styles.modalClose} onClick={() => { setSelectedStudent(null); setStudentRecords([]); }} aria-label="Close sensitive records">&times;</button>
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
                            )) : <p className={styles.shelfEmpty}>No stored records for this account.</p>}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

function DocumentTableSection({ title, description, sensitive, email, table, pdfDialogOpenerRef, onLinkJourneyStart, onLinkJourneySuccess, onLinkJourneyError }: DocumentTableSectionProps) {
    const {
        fileRef, data, search, setSearch, page, setPage, totalPages,
        isLoading, refresh, setRefresh, triggerUpload, handleFile, handleFiles,
        deleteFile, deleteSelected,
        selectedIds, toggleSelect, toggleSelectAll,
    } = table;

    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [hasAcceptedUploadDisclaimer, setHasAcceptedUploadDisclaimer] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [webLink, setWebLink] = useState("");
    const [isUploadingLink, setIsUploadingLink] = useState(false);
    const [isRechecking, setIsRechecking] = useState(false);
    const [recheckJourney, setRecheckJourney] = useState<Journey | null>(null);
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

    const recheckSensitivePdfs = async () => {
        if (!sensitive || isRechecking) return;
        setIsRechecking(true);
        setRecheckJourney({
            source: "Sensitive PDF recheck",
            title: "Rechecking sensitive PDFs",
            startedAt: new Date().toISOString(),
            sensitive: true,
            isFinished: false,
            steps: [
                { label: "Rechecking PDFs", detail: "Reading each private PDF and matching verified school IDs…", state: "active" },
                { label: "Refreshing student bookshelves", detail: "Saving updated records securely…", state: "waiting" },
                { label: "Ready", detail: "PDF recheck is complete.", state: "waiting" },
            ],
        });
        try {
            const response = await Fetch_to(api_link.storage.recheck_sensitive_records, { email });
            if (!response.success) {
                const message = response.message || "Please try again.";
                setRecheckJourney((current) => current && ({
                    ...current,
                    isFinished: true,
                    result: message,
                    steps: current.steps.map((step, index) => index === 0 ? { ...step, state: "error", detail: message } : step),
                }));
                return;
            }
            setRefresh(true);
            window.dispatchEvent(new Event("student-records-updated"));
            const failed = Array.isArray(response.data?.outcomes)
                ? response.data.outcomes.filter((item: SensitiveRecheckOutcome) => !item.success).length
                : 0;
            const outcomes = Array.isArray(response.data?.outcomes) ? response.data.outcomes as SensitiveRecheckOutcome[] : [];
            const message = `${response.data?.message || response.message || "PDFs rechecked."}${failed ? ` ${failed} PDF(s) could not be rechecked.` : ""}`;
            setRecheckJourney((current) => current && ({
                ...current,
                isFinished: true,
                result: message,
                files: outcomes.map((item) => ({
                    name: item.file_name || "PDF",
                    status: item.success ? `${item.newly_matched_students || 0} new bookshelf entr${item.newly_matched_students === 1 ? "y" : "ies"}` : "Could not recheck",
                    detail: item.message || "",
                    sensitive: !item.success,
                })),
                steps: current.steps.map((step) => ({ ...step, state: "complete" })),
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Please try again.";
            setRecheckJourney((current) => current && ({
                ...current,
                isFinished: true,
                result: message,
                steps: current.steps.map((step, index) => index === 0 ? { ...step, state: "error", detail: message } : step),
            }));
        } finally {
            setIsRechecking(false);
        }
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
            {recheckJourney && <ProcessingJourney
                journey={recheckJourney}
                onDismiss={() => setRecheckJourney(null)}
                onCancel={() => {}}
                onRestart={() => {}}
            />}
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
                    if (!hasAcceptedUploadDisclaimer) {
                        event.target.value = "";
                        return;
                    }
                    if (event.target.files?.length) {
                        setIsPdfDialogOpen(false);
                        setHasAcceptedUploadDisclaimer(false);
                    }
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
                                        {!sensitive && <button className={styles.button_view} title="View PDF" aria-label={`View ${doc.file_name || "PDF"}`} onClick={() => openPdfPreview(doc)}>
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

            {preview && <PdfViewer filePath={preview.filePath} fileName={preview.name} onClose={closePdfPreview} />}
            {isAddDialogOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAddDialogOpen(false)}>
                    <div className={styles.addDialog} role="dialog" aria-modal="true" aria-labelledby="add-document-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div><span className={styles.dialogEyebrow}>DOCUMENT LIBRARY</span><h3 id="add-document-title">Add a document</h3></div>
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
                        <UploadDisclaimer sensitive={Boolean(sensitive)} accepted={hasAcceptedUploadDisclaimer} onAcceptedChange={setHasAcceptedUploadDisclaimer} />
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
    const [privacyReview, setPrivacyReview] = useState<{ warnings: PrivacyWarning[]; resolve?: (confirmed: boolean) => void; restored?: boolean } | null>(null);
    const restoredJourneyRef = useRef(false);
    const publicPdfDialogOpenerRef = useRef<(() => void) | null>(null);
    const sensitivePdfDialogOpenerRef = useRef<(() => void) | null>(null);

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

    const journeyStorageKey = email ? `laco:document-journey:${email.trim().toLowerCase()}` : "";
    const privacyReviewStorageKey = email ? `laco:privacy-review:${email.trim().toLowerCase()}` : "";

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
        if (!privacyReviewStorageKey) return;
        try {
            const saved = localStorage.getItem(privacyReviewStorageKey);
            if (!saved) return;
            const pending = JSON.parse(saved) as { warnings?: PrivacyWarning[]; savedAt?: number };
            if (Array.isArray(pending.warnings) && pending.warnings.length && Date.now() - Number(pending.savedAt) < 60 * 60 * 1000) {
                setPrivacyReview({ warnings: pending.warnings, restored: true });
            } else {
                localStorage.removeItem(privacyReviewStorageKey);
            }
        } catch {
            localStorage.removeItem(privacyReviewStorageKey);
        }
    }, [privacyReviewStorageKey]);

    useEffect(() => {
        let cancelled = false;
        const restoreJourney = async () => {
            let checkedStatus = false;
            let savedJourney: Journey | null = null;
            try {
                const saved = journeyStorageKey ? localStorage.getItem(journeyStorageKey) : null;
                if (saved) savedJourney = JSON.parse(saved) as Journey;
            } catch { /* Ignore corrupt saved journey data and recover from server progress. */ }
            const statusOrder = savedJourney ? [savedJourney.sensitive === true] : [false, true];
            for (const sensitive of statusOrder) {
                try {
                    const response = await fetch(api_link.storage.processing_status, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email,
                            sensitive,
                            ...(savedJourney?.sensitive === true && sensitive ? { started_at: savedJourney.startedAt, include_completed: true } : {}),
                        }),
                    });
                    const result = await response.json();
                    if (response.ok && result?.success === true) checkedStatus = true;
                    const active = (result?.progress ?? []).find((item: { processing_progress?: { status?: string } }) => item.processing_progress?.status === "processing");
                    const completed = !active && savedJourney?.sensitive === true && sensitive
                        ? (result?.progress ?? []).find((item: { processing_progress?: { status?: string } }) => item.processing_progress?.status === "complete")
                        : undefined;
                    const activeJob = active || completed;
                    if (!response.ok || !activeJob || cancelled) continue;

                    const progress = activeJob.processing_progress;
                    const isQa = progress.phase === "generating_qa";
                    const steps: Omit<JourneyStep, "state">[] = sensitive
                        ? [
                            { label: "Uploading the private PDF", detail: "Storing your document securely…" },
                            { label: "Reading and matching student and teacher records", detail: progress.message || "Checking records against registered school IDs…" },
                            { label: "Saving matched records", detail: "Encrypting records into each student’s bookshelf…" },
                            { label: "Ready", detail: "Sensitive document processing is complete." },
                        ]
                        : [
                            { label: "Uploading", detail: "Uploading your PDF…" },
                            { label: "Checking your PDF", detail: "Checking for sensitive information…" },
                            { label: "Reading the document", detail: "Extracting text from every PDF page…" },
                            { label: "Summarizing every PDF page", detail: "Analyzing page text and visuals…" },
                            { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
                            { label: "Ready to review", detail: "Your document is ready." },
                        ];
                    const activeIndex = progress.phase === "uploading" ? 0 : sensitive ? progress.phase === "saving_matched_records" ? 2 : 1 : isQa ? 4 : progress.phase === "summarizing_pages" ? 3 : progress.phase === "reading_document" ? 2 : 1;
                    if (progress.status === "complete") {
                        setJourney((currentJourney) => {
                            const recovered = currentJourney || {
                                source: "Sensitive PDF",
                                title: activeJob.file_name || progress.file_name || "Sensitive PDF processing",
                                startedAt: savedJourney?.startedAt || activeJob.created_at || new Date().toISOString(),
                                sensitive: true,
                                isFinished: false,
                                steps: steps.map((step, index) => ({ ...step, state: index <= activeIndex ? "complete" as const : "waiting" as const })),
                            };
                            return { ...recovered, isFinished: true, result: "Sensitive PDF processing completed.", steps: recovered.steps.map((step) => ({ ...step, state: "complete" })) };
                        });
                        return;
                    }
                    setJourney((current) => current || {
                        source: sensitive ? "Sensitive PDF" : "PDF upload",
                        title: activeJob.file_name || progress.file_name || "PDF processing",
                        startedAt: savedJourney?.startedAt || activeJob.created_at || new Date().toISOString(),
                        sensitive,
                        isFinished: false,
                        steps: steps.map((step, index) => ({
                            ...step,
                            state: index < activeIndex ? "complete" : index === activeIndex ? "active" : "waiting",
                            ...(index === activeIndex ? { detail: progress.message || step.detail } : {}),
                        })),
                    });
                    return;
                } catch {
                    // A failed recovery lookup should not prevent normal document use.
                }
            }
            if (!checkedStatus || cancelled || !restoredJourneyRef.current) return;
            let hasSavedPrivacyReview = false;
            try { hasSavedPrivacyReview = Boolean(privacyReviewStorageKey && localStorage.getItem(privacyReviewStorageKey)); } catch { /* Ignore unavailable browser storage. */ }
            if (hasSavedPrivacyReview) return;
            setJourney((current) => {
                if (!current?.restoredFromStorage) return current;
                const activeIndex = current.steps.findIndex((step) => step.state === "active");
                const errorIndex = Math.max(0, activeIndex);
                const message = "This upload was interrupted before PDF processing began. Reselect the PDF to run its privacy check and continue.";
                return {
                    ...current,
                    isFinished: true,
                    canRestart: true,
                    result: message,
                    steps: current.steps.map((step, index) => index === errorIndex ? { ...step, state: "error", detail: message } : step),
                };
            });
        };
        void restoreJourney();
        return () => { cancelled = true; };
    }, [email, privacyReviewStorageKey]);

    const completeJourney = (result?: string, details?: { uploaded?: Array<Record<string, unknown>>; privacyScan?: Array<Record<string, unknown>> }) => setJourney((current) => {
        if (!current) return current;
        const uploaded = details?.uploaded ?? [];
        let files: JourneyFileResult[] = [];
        if (current.sensitive) {
            files = uploaded.map((item) => {
                const skipped = Number(item.skippedRecords ?? 0);
                const invalid = Number(item.invalidRecords ?? 0);
                const reasons = [
                    Number(item.skippedMissingId ?? 0) ? `${item.skippedMissingId} missing or invalid ID` : "",
                    Number(item.skippedUnmatchedId ?? 0) ? `${item.skippedUnmatchedId} unmatched or ambiguous ID` : "",
                    invalid ? `${invalid} incomplete extraction result${invalid === 1 ? "" : "s"}` : "",
                ].filter(Boolean).join(" · ");
                return {
                    name: String(item.originalName || "PDF"),
                    status: item.success === true ? `${Number(item.matchedStudents ?? 0)} matched record group${Number(item.matchedStudents ?? 0) === 1 ? "" : "s"}` : "Processing failed",
                    detail: item.success === true ? (skipped || invalid ? `${skipped + invalid} extracted record(s) were not saved${reasons ? `: ${reasons}` : ""}.` : "No records were skipped during matching.") : String(item.message || "The PDF could not be processed."),
                    sensitive: skipped + invalid > 0 || item.success !== true,
                };
            });
        } else {
            const scanResults = details?.privacyScan ?? [];
            files = scanResults.map((item) => {
                const found = item.containsSensitiveInfo === true || item.contains_sensitive_info === true;
                const findings = Array.isArray(item.findings) ? item.findings as Array<Record<string, unknown>> : [];
                const findingDetail = findings.map((finding) => {
                    const category = typeof finding.category === "string" ? finding.category.replaceAll("_", " ") : "sensitive information";
                    const pages = Array.isArray(finding.pages) ? ` · page${finding.pages.length === 1 ? "" : "s"} ${finding.pages.join(", ")}` : "";
                    return `${category}${pages}`;
                }).join("; ");
                return {
                    name: String(item.fileName || item.file_name || "PDF"),
                    status: found ? "Sensitive indicators detected" : "No sensitive info detected",
                    detail: findingDetail || (found ? "Review this PDF before sharing it in the public library." : "No sensitive indicators were reported by the scan."),
                    sensitive: found,
                };
            });
        }
        for (const item of uploaded) {
            if (item.success !== true && !files.some((file) => file.name === String(item.originalName || ""))) {
                files.push({ name: String(item.originalName || "PDF"), status: "Processing failed", detail: String(item.message || "The PDF could not be processed."), sensitive: true });
            }
        }
        if (!current.sensitive && files.length === 0 && uploaded.length) {
            for (const item of uploaded) files.push({ name: String(item.originalName || "PDF"), status: item.success === true ? "Privacy scan result unavailable" : "Processing failed", detail: String(item.message || "No scan details were returned."), sensitive: item.success !== true });
        }
        return {
            ...current,
            isFinished: true,
            result,
            files,
            steps: current.steps.map((step) => ({ ...step, state: "complete" })),
        };
    });

    const failJourney = (message: string, details?: { uploaded?: Array<Record<string, unknown>>; privacyScan?: Array<Record<string, unknown>> }) => setJourney((current) => {
        if (!current) return current;
        const activeIndex = current.steps.findIndex((step) => step.state === "active");
        const files: JourneyFileResult[] = (details?.uploaded ?? []).map((item) => ({
            name: String(item.originalName || "PDF"),
            status: item.success === true ? "Processed" : "Processing failed",
            detail: String(item.message || "The PDF could not be processed."),
            sensitive: item.success !== true,
        }));
        if (!current.sensitive) {
            for (const item of details?.privacyScan ?? []) {
                const name = String(item.fileName || item.file_name || "PDF");
                if (!files.some((file) => file.name === name)) files.push({
                    name,
                    status: item.containsSensitiveInfo === true || item.contains_sensitive_info === true ? "Sensitive indicators detected" : "No sensitive info detected",
                    detail: Array.isArray(item.findings) ? item.findings.map((finding) => {
                        const record = finding as Record<string, unknown>;
                        return typeof record.category === "string" ? record.category.replaceAll("_", " ") : "sensitive information";
                    }).join("; ") : "",
                    sensitive: item.containsSensitiveInfo === true || item.contains_sensitive_info === true,
                });
            }
        }
        return {
            ...current,
            isFinished: true,
            result: message,
            files,
            steps: current.steps.map((step, index) => index === activeIndex ? { ...step, state: "error", detail: message } : step),
        };
    });

    useEffect(() => {
        if (!journey || journey.isFinished) return;
        const pollProgress = async () => {
            try {
                const response = await fetch(api_link.storage.processing_status, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, started_at: journey.startedAt, sensitive: journey.sensitive, include_completed: journey.sensitive === true }),
                });
                const result = await response.json();
                const currentProgress = result?.progress?.find((item: { processing_progress?: { status?: string } }) => item.processing_progress?.status === "processing")
                    || result?.progress?.[0];
                const progress = currentProgress?.processing_progress;
                if (!response.ok || !progress) return;
                if (progress.status === "failed") {
                    failJourney(progress.message || "PDF processing failed.");
                    return;
                }
                if (journey.sensitive && progress.status === "complete") {
                    setJourney((current) => current && !current.isFinished ? {
                        ...current,
                        isFinished: true,
                        result: "Sensitive PDF processing completed.",
                        steps: current.steps.map((step) => ({ ...step, state: "complete" })),
                    } : current);
                    return;
                }

                const total = Number(progress.total_pages || 0);
                const currentPage = Number(progress.current_page || 0);
                const activeIndex = progress.phase === "uploading" ? 0 : journey.sensitive ? progress.phase === "saving_matched_records" ? 2 : 1 : progress.phase === "generating_qa" ? 4 : progress.phase === "summarizing_pages" ? 3 : progress.phase === "reading_document" ? 2 : 1;
                const detail = journey.sensitive
                    ? progress.message || (progress.phase === "saving_matched_records" ? "Saving matched records securely…" : `Matching records on page ${currentPage} of ${total}`) + `${progress.file_name ? ` · ${progress.file_name}` : ""}`
                    : progress.phase === "generating_qa"
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
    }, [journey?.isFinished, journey?.startedAt, journey?.sensitive, email]);

    const startPdfJourney = (files: File[]) => beginJourney(
        "PDF upload",
        files.length === 1 ? files[0].name : `${files.length} PDF files`,
        [
            { label: "Uploading", detail: "Uploading your PDF…" },
            { label: "Checking your PDF", detail: "Checking for sensitive information…" },
            { label: "Reading the document", detail: "Extracting text from every PDF page…" },
            { label: "Summarizing every PDF page", detail: "Analyzing page text and visuals…" },
            { label: "Generating questions and answers", detail: "Choosing useful questions based on the information in each page…" },
            { label: "Ready to review", detail: "Your document is ready." },
        ],
    );

    const startSensitivePdfJourney = (files: File[]) => beginJourney(
        "Sensitive PDF",
        files.length === 1 ? files[0].name : `${files.length} PDF files`,
        [
            { label: "Uploading the private PDF", detail: "Storing your document securely…" },
            { label: "Reading and matching student and teacher records", detail: "Checking records against registered school IDs…" },
            { label: "Saving matched records", detail: "Encrypting records into each student’s bookshelf…" },
            { label: "Ready", detail: "Sensitive document processing is complete." },
        ],
        true,
    );

    const markUploadTransferred = () => setJourney((current) => current && !current.isFinished ? {
        ...current,
        steps: current.steps.map((step, index) => index === 0
            ? { ...step, state: "complete" }
            : index === 1
                ? { ...step, state: "active", detail: `Upload complete. ${step.label}…` }
                : { ...step, state: "waiting" }),
    } : current);

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
        onUploadTransferred: markUploadTransferred,
        onUploadSuccess: (message?: string, details?: UploadResultDetails) => {
            try { if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey); } catch { /* Ignore unavailable browser storage. */ }
            completeJourney(message, details);
        },
        onUploadError: (message: string, details?: UploadResultDetails) => {
            try { if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey); } catch { /* Ignore unavailable browser storage. */ }
            failJourney(message, details);
        },
        onPrivacyReview: (warnings: PrivacyWarning[]) => new Promise<boolean>((resolve) => {
            try {
                if (privacyReviewStorageKey) localStorage.setItem(privacyReviewStorageKey, JSON.stringify({ warnings, savedAt: Date.now() }));
            } catch { /* The in-memory review still works if storage is unavailable. */ }
            setJourney((current) => current && !current.isFinished ? {
                ...current,
                steps: current.steps.map((step, index) => index === 0
                    ? { ...step, state: "complete" }
                    : index === 1
                        ? { ...step, state: "active", detail: "Privacy scan finished. Review the flagged information to continue." }
                        : { ...step, state: "waiting" }),
            } : current);
            setPrivacyReview({ warnings, resolve });
        }),
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
        onUploadSuccess: (message?: string, details?: UploadResultDetails) => {
            completeJourney(message, details);
            window.dispatchEvent(new Event("student-records-updated"));
        },
        onUploadError: (message: string, details?: UploadResultDetails) => {
            failJourney(message, details);
            window.dispatchEvent(new Event("student-records-updated"));
        },
    };
    const sensitiveDocs = useDocumentTable(
        {
            retrieve: api_link.storage.retrieve_sensitive,
            upload: api_link.storage.uploadpdf_sensitive,
            download: api_link.storage.downloadpdf_sensitive,
            delete: api_link.storage.deletepdf_sensitive,
            sensitive: true,
        },
        email,
        sensitiveNotifyHandlers
    );

    return (
        <section className={styles.container}>
            {privacyReview && <PrivacyReviewDialog
                warnings={privacyReview.warnings}
                restored={privacyReview.restored}
                onCancel={() => {
                    const review = privacyReview;
                    setPrivacyReview(null);
                    try {
                        if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey);
                        if (review.restored && journeyStorageKey) localStorage.removeItem(journeyStorageKey);
                    } catch { /* Ignore unavailable browser storage. */ }
                    if (review.resolve) review.resolve(false);
                    if (review.restored) setJourney(null);
                }}
                onContinue={() => {
                    const review = privacyReview;
                    setPrivacyReview(null);
                    try { if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey); } catch { /* Ignore unavailable browser storage. */ }
                    if (review.resolve) {
                        review.resolve(true);
                    } else {
                        try { if (journeyStorageKey) localStorage.removeItem(journeyStorageKey); } catch { /* Ignore unavailable browser storage. */ }
                        setJourney(null);
                        publicPdfDialogOpenerRef.current?.();
                    }
                }}
            />}
            {journey && <ProcessingJourney
                journey={journey}
                onDismiss={() => setJourney(null)}
                onRestart={() => {
                    try {
                        if (journeyStorageKey) localStorage.removeItem(journeyStorageKey);
                        if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey);
                    } catch { /* Ignore unavailable browser storage. */ }
                    setJourney(null);
                    (journey.sensitive ? sensitivePdfDialogOpenerRef : publicPdfDialogOpenerRef).current?.();
                }}
                onCancel={() => {
                    const table = journey.sensitive ? sensitiveDocs : publicDocs;
                    const aborted = table.cancelUpload();
                    void table.deleteIncompleteUploads(journey.startedAt);
                    if (!aborted) {
                        try {
                            if (journeyStorageKey) localStorage.removeItem(journeyStorageKey);
                            if (privacyReviewStorageKey) localStorage.removeItem(privacyReviewStorageKey);
                        } catch { /* Ignore unavailable browser storage. */ }
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
                    pdfDialogOpenerRef={publicPdfDialogOpenerRef}
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
                    pdfDialogOpenerRef={sensitivePdfDialogOpenerRef}
                    onLinkJourneyStart={startLinkJourney}
                    onLinkJourneySuccess={completeJourney}
                    onLinkJourneyError={failJourney}
                />
            </div>
            <StudentRecordsBookshelf email={email} />
        </section>
    );
}
