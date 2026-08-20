"use client";
import styles from "./css/styles.module.css";
import { 
    Fetch_to, 
    // Popup_info 
} from "@/utilities";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";

type ManageUserDataProps = {
    created_at?: string;
    email?: string;
    f_name?: string;
    id?: number;
    status?: string;
    year?: string;
    role?: string;
    department?: string;
}

type System_logs = {
    request?: string;
    email?: string;
    api_request?: string;
    uploaded_pdf?: string;
}

const PAGE_SIZE = 30;

export default function PendingUser() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    // const [isLoadState, setIsLoadState] = useState(false);
    // const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    // const [isLoadError, setIsLoadError] = useState(false);
    // const [isLoadStatus, setIsLoadStatus] = useState("");
    const [viewingUser, setViewingUser] = useState<ManageUserDataProps | null>(null);

    useEffect(() => {
        const RetrieveUserData = async () => {
            setIsLoading(true);
            const response = await Fetch_to(api_link.admin.retrieve_user, {
                page,
                limit: PAGE_SIZE,
                search: "",
                year: "",
                role: "Student",
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
    // const handleStatusChange = async (target: ManageUserDataProps, newStatus: string) => {
    //     setIsLoadState(true);
    //     setIsLoadStateDone(true);
    //     setIsLoadStatus("Updating Please Wait...");
    //     const response = await Fetch_to(api_link.admin.update_user_status, { id: target.id, status: newStatus });
    //     if (response.success) {
    //         setIsLoadStateDone(false);
    //         setIsLoadStatus(response.data.message);
    //         setTimeout(() => setIsLoadState(false), 3000);
    //         setViewingUser((prev) => (prev ? { ...prev, status: newStatus } : prev));
    //         setRefresh(!refresh);
    //     } else {
    //         setIsLoadStateDone(false);
    //         setIsLoadStatus(response.message);
    //         setIsLoadError(true);
    //         setTimeout(() => setIsLoadState(false), 3000);
    //     }
    // };

    return (
        <section className={styles.container}>
            {/* {isLoadState ? (
                isLoadStateDone ? (
                    <Popup_info status={isLoadStatus} bg_color="var(--primary)" states={true} load={true} error={false} />
                ) : (
                    isLoadError ? (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-red)" states={false} load={true} error={true} />
                    ) : (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-green)" states={false} load={true} error={false} />
                    )
                )

            ) : null} */}
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonShort}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonLong}`} /></td>
                                        <td>
                                            <span className={styles.skeletonIconSm} />
                                        </td>
                                    </tr>
                                ))
                            ) : data && data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr key={index}>
                                        <td> {row.id} </td>
                                        <td> {row.f_name} </td>
                                        <td> {row.role} </td>
                                        <td> {row.email} </td>
                                        <td>
                                            <button
                                                className={styles.button_view}
                                                onClick={() => setViewingUser(row)}
                                                title="View details"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
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
                                <span>{viewingUser.id || " - "}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Name</span>
                                <span>{viewingUser.f_name || " - "}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Department</span>
                                <span>{viewingUser.department || " - "}</span>
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
                        <div className={styles.modalFooter}>
                            <button className={styles.button_decline}>
                                Decline
                            </button>
                            <button className={styles.button_accept}>
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}