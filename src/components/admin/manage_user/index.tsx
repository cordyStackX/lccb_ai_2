"use client";
import styles from "./css/styles.module.css";
import { Fetch_to, Popup_info, SweetAlert2 } from "@/utilities";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

type ManageUserDataProps = {
    created_at?: string;
    email?: string;
    f_name?: string;
    id?: number;
    status?: string;
    year?: string;
    role?: string;
}

type System_logs = {
    request?: string;
    email?: string;
    api_request?: string;
    uploaded_pdf?: string;
}

const PAGE_SIZE = 30;

export default function ManageUser() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [yearFilter, setYearFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");
    const [viewingUser, setViewingUser] = useState<ManageUserDataProps | null>(null);

    useEffect(() => {
        const RetrieveUserData = async () => {
            setIsLoading(true);
            const response = await Fetch_to(api_link.admin.retrieve_user, {
                page,
                limit: PAGE_SIZE,
                search,
                year: yearFilter,
                role: roleFilter,
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
    }, [refresh, page, search, yearFilter, roleFilter]);

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

    const handleDelete = async (target: ManageUserDataProps) => {
        const alert2 = await SweetAlert2("Terminate?", `Are you sure want to Terminate this ${target.email}`, "warning", true, "Yes", true, "No");
        if (!alert2.isConfirmed) return;
        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus(`Terminating ${target.email} Please Wait...`);
        const response = await Fetch_to(api_link.admin.delete_user, { email: target.email });
        Swal.close();
        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            setRefresh(!refresh);
        } else {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
        }
    };

    const handleStatusChange = async (target: ManageUserDataProps, newStatus: string) => {
        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Updating Please Wait...");
        const response = await Fetch_to(api_link.admin.update_user_status, { id: target.id, status: newStatus });
        if (response.success) {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.data.message);
            setTimeout(() => setIsLoadState(false), 3000);
            setViewingUser((prev) => (prev ? { ...prev, status: newStatus } : prev));
            setRefresh(!refresh);
        } else {
            setIsLoadStateDone(false);
            setIsLoadStatus(response.message);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
        }
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 20c0-4 4-6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14 14l6-6 2 2-6 6-3 1 1-3z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <h1>Manage User</h1>
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
                    View, filter, and manage registered students and teachers
                </p>

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
                    <select
                        value={yearFilter}
                        onChange={(e) => {
                            setYearFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Years</option>
                        <option value="Kinder Garten">Kinder Garten</option>
                        <option value="Elementary">Elementary</option>
                        <option value="High School">High School</option>
                        <option value="Senior High School">Senior High School</option>
                        <option value="College">College</option>
                    </select>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Roles</option>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                    </select>
                </section>

                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Year</th>
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
                                            <span className={styles.skeletonIconSm} />
                                        </td>
                                    </tr>
                                ))
                            ) : data && data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr key={index}>
                                        <td> {row.f_name} </td>
                                        <td> {row.year} </td>
                                        <td> {row.email} </td>
                                        <td>
                                            <button
                                                className={styles.button_view}
                                                onClick={() => setViewingUser(row)}
                                                title="View details"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2" />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                            </button>
                                            <button
                                                className={styles.button_delete}
                                                onClick={() => handleDelete(row)}
                                                title="Delete user"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
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
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Status</span>
                                <select
                                    className={styles.modalSelect}
                                    value={viewingUser.status}
                                    onChange={(e) => handleStatusChange(viewingUser, e.target.value)}
                                >
                                    <option value="active">🟢 Active</option>
                                    <option value="suspend">🟡 Suspend</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}