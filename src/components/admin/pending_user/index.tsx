"use client";
import styles from "./css/styles.module.css";
import { 
    Fetch_to, 
    Popup_info 
} from "@/utilities";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";

type ManageUserDataProps = {
    created_at?: string;
    email?: string;
    f_name?: string;
    id?: number;
    status?: string;
    role?: string;
    department?: string;
    auth_student?: AuthStudent[];
}

type AuthStudent = {
    year?: string;
    department?: string;
    school_id?: string;
};

type System_logs = {
    request?: string;
    email?: string;
    api_request?: string;
    uploaded_pdf?: string;
}

const PAGE_SIZE = 30;

const DECLINE_REASONS = [" Wrong ID", " Wrong Name", " Wrong Year Level", " Wrong Department", " Wrong Role"];

export default function PendingUser() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");
    const [viewingUser, setViewingUser] = useState<ManageUserDataProps | null>(null);
    const [showDeclinePanel, setShowDeclinePanel] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState("");

    useEffect(() => {
        const RetrieveUserData = async () => {
            setIsLoading(true);
            const response = await Fetch_to(api_link.admin.retrieve_user, {
                page,
                limit: PAGE_SIZE,
                search: "",
                year: "",
                role: "Student",
                status: "under_review",
            });
            if (response.success) {
                setData(response.data.message);
                setTotalPages(response.data.totalPages ?? 1);
            }
            setIsLoading(false);
        };
        RetrieveUserData();
        const RetrieveUserDataLogs = async () => {
            const response = await Fetch_to(api_link.admin.system_logs);
            if (response.success) {
                setSystem_logs(response.data.message);
            }
            setRefresh(false);
        };
        RetrieveUserDataLogs();
    }, [refresh, page]);

    const getApiCount = (email?: string) => {
        if (!email) return 0;
        return system_logs.reduce((total, log) => {
            if (log.request === email) {
                return total + Number(log.api_request ?? 0);
            }
            return total;
        }, 0);
    };

    const getUploadedCount = (email?: string) => {
        if (!email) return 0;
        return system_logs.reduce((total, log) => {
            if (log.request === email) {
                return total + Number(log.uploaded_pdf ?? 0);
            }
            return total;
        }, 0);
    };

    // NOTE: kept for whenever you want to wire Accept/Decline to a real
    // status update call. Not attached to any button below on purpose —
    // layout only, per request.
    const handleStatusChange = async (target: ManageUserDataProps, newStatus: string) => {
        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Updating Please Wait...");
        const response = await Fetch_to(api_link.admin.update_user_status, { email: target.email, status: newStatus, reason: `${selectedReasons}. ${customReason}` });
        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            setViewingUser(null);
            setRefresh(!refresh);
        } else {
            setIsLoadStateDone(false);
            setViewingUser(null);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
        }
    };

    const toggleReason = (reason: string) => {
        setSelectedReasons((prev) =>
            prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
        );
    };


    const formatSchoolId = (id?: string) => {
        if (!id) return " - ";
        const digits = String(id).replace(/\D/g, ""); // strip any non-digits just in case
        if (digits.length !== 9) return digits; // fallback if it doesn't match expected length
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    };

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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M4 19c.7-3 2.3-4.5 5-4.5s4.3 1.5 5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="17" cy="16" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M17 14v2l1.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h1>Pending User</h1>
                </span>
            </header>

            <div className={styles.status}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitleGroup}>
                        <h2>All Users</h2>
                    </span>
                    <div className={styles.sectionActions}>
                        <button
                            className={styles.button_download}
                            disabled={refresh}
                            style={{ opacity: refresh ? 0.5 : 1 }}
                            onClick={() => setRefresh(!refresh)}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
                <p className={styles.sectionDescription}>
                    Confirm Student ID if Matches 
                </p>

                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Gmail</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonShort}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonLong}`} /></td>
                                        <td>
                                            <span className={styles.skeletonIconSm} />
                                        </td>
                                    </tr>
                                ))
                            ) : data && data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr key={index}>
                                        <td> {formatSchoolId(row.auth_student?.[0].school_id)} </td>
                                        <td> {row.f_name} </td>
                                        <td> {row.role} </td>
                                        <td> {row.email} </td>
                                        <td> {row.status} </td>
                                        <td>
                                            <button
                                                className={styles.button_view}
                                                onClick={() => {
                                                    setViewingUser(row);
                                                    setShowDeclinePanel(false);
                                                    setSelectedReasons([]);
                                                    setCustomReason("");
                                                }}
                                                title="View details"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                        No User Found
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
            </div>

            {viewingUser && (
                <div className={styles.modalOverlay} onClick={() => setViewingUser(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{viewingUser.f_name || viewingUser.email}</h3>
                            <button className={styles.modalClose} onClick={() => setViewingUser(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Id</span>
                                <span>
                                    {viewingUser.role === "Business"
                                        ? viewingUser.id
                                        : formatSchoolId(viewingUser.auth_student?.[0]?.school_id)}
                                </span>
                            </div>
                           <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>{viewingUser.role === "Business" ? "Business Name" : "FullName"}</span>
                                <span>{viewingUser.f_name || " - "}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Year Level</span>
                                <span>
                                    {viewingUser.role === "Business"
                                        ? "N/A"
                                        : viewingUser.auth_student?.[0]?.year}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Department</span>
                                <span>
                                    {viewingUser.role === "Business"
                                        ? "N/A"
                                        : viewingUser.auth_student?.[0]?.department}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Role</span>
                                <span>{viewingUser.role || " - "}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Created At</span>
                                <span>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString("en-US") : " - "}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>API Request</span>
                                <span>{getApiCount(viewingUser.email)}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Uploaded PDF</span>
                                <span>{getUploadedCount(viewingUser.email)}</span>
                            </div>
                        </div>
                       {showDeclinePanel ? (
                            <div className={styles.modalBody_decline}>
                                <p className={styles.sectionTitleGroup}>Select reason(s) for declining</p>
                                <div className={styles.reasonList}>
                                    {DECLINE_REASONS.map((reason) => (
                                        <label
                                            key={reason}
                                            className={`${styles.reasonOption} ${selectedReasons.includes(reason) ? styles.reasonOptionChecked : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedReasons.includes(reason)}
                                                onChange={() => toggleReason(reason)}
                                            />
                                            <span>{reason}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className={styles.reasonOtherRow}>
                                    <span className={styles.detailLabel}>Other</span>
                                    <input
                                        className={styles.reasonOtherInput}
                                        type="text"
                                        placeholder="Additional notes (optional)"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                    />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button className={styles.button_accept} onClick={() => setShowDeclinePanel(false)}>
                                        Back
                                    </button>
                                    <button
                                        className={styles.button_decline}
                                        disabled={selectedReasons.length === 0 && !customReason.trim()}
                                        onClick={() => handleStatusChange(viewingUser!, "decline")}
                                    >
                                        Confirm Decline
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.modalFooter}>
                                <button className={styles.button_decline} onClick={() => setShowDeclinePanel(true)}>
                                    Decline
                                </button>
                                <button className={styles.button_accept} onClick={() => handleStatusChange(viewingUser!, "active")}>
                                    Accept
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
        </section>
    );
}