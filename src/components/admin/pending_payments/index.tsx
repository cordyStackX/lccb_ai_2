"use client";

import { useEffect, useState } from "react";
import styles from "./css/styles.module.css";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

type Payment = {
    account_number?: string | number | null;
    amount?: string | number | null;
    created_at?: string | null;
    email?: string | null;
    id?: string | number | null;
    method?: string | null;
    plan_type?: string | null;
    reason?: string | null;
    status?: string | null;
    vat?: string | number | null;
};

type PendingPaymentsProps = {
    email: string;
};

const PAGE_SIZE = 30;
type PaymentFilter = "all" | "declined" | "success" | "pending" | "refund_requested";
const DECLINE_REASONS = [
    "Wrong Account Number",
    "Undefined Payment Method",
    "No Matching Transaction Found",
    "Duplicate Payment",
    "Payment Not Received",
    "Suspected Fraudulent Transaction"
];

const getStatusStyle = (status?: string | null) => {
    const normalizedStatus = status?.trim().toLowerCase() ?? "pending";

    if (["decline", "declined", "failed", "failure", "rejected"].includes(normalizedStatus)) {
        return styles.statusDeclined;
    }

    if (["success", "successful", "paid", "active", "completed", "complete", "refunded"].includes(normalizedStatus)) {
        return styles.statusSuccess;
    }

    return styles.statusPending;
};

const isPending = (status?: string | null) =>
    !["decline", "declined", "failed", "failure", "rejected", "success", "successful", "paid", "active", "completed", "complete", "refund_requested", "refunded"].includes(status?.trim().toLowerCase() ?? "pending");

const isRefundRequested = (status?: string | null) =>
    status?.trim().toLowerCase() === "refund_requested";

const formatStatus = (status?: string | null) => {
    if (!status) return "Pending";

    return status
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatPaymentDate = (createdAt?: string | null) => {
    if (!createdAt) return "—";

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export default function PendingPayments({ email }: PendingPaymentsProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
    const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
    const [showDeclinePanel, setShowDeclinePanel] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState("");

    useEffect(() => {
        let isCurrentRequest = true;

        const retrievePayments = async () => {
            setIsLoading(true);
            setError("");

            const response = await Fetch_to(api_link.admin.pending_payment, {
                email,
                page,
                limit: PAGE_SIZE,
                search: paymentFilter,
            });

            if (!isCurrentRequest) return;

            if (response.success) {
                setPayments(response.data.message ?? []);
                setTotalPages(response.data.totalPages ?? 1);
            } else {
                setPayments([]);
                setTotalPages(1);
                setError(response.message ?? "Unable to retrieve payments.");
            }

            setIsLoading(false);
        };

        retrievePayments();

        return () => {
            isCurrentRequest = false;
        };
    }, [email, page, paymentFilter, refreshKey]);

    const openPayment = (payment: Payment) => {
        setViewingPayment(payment);
        setShowDeclinePanel(false);
        setSelectedReasons([]);
        setCustomReason("");
    };

    const toggleReason = (reason: string) => {
        setSelectedReasons((currentReasons) =>
            currentReasons.includes(reason)
                ? currentReasons.filter((selectedReason) => selectedReason !== reason)
                : [...currentReasons, reason]
        );
    };

    const updateDisplayedPayment = async(status: "success" | "declined" | "refunded", reason?: string) => {
        if (!viewingPayment) return;

        const paymentEmail = viewingPayment.email?.trim();
        if (!paymentEmail) {
            alert("The selected payment does not have an email address.");
            return;
        }

        const response = await Fetch_to(api_link.admin.update_payment, {
            status,
            reason,
            email: paymentEmail,
        });

        if (response.success) {
          setRefreshKey((key) => key + 1);
        } else {
          alert(response.message);
        }
        setViewingPayment(null);
        setShowDeclinePanel(false);
    };

    const declineReason = [...selectedReasons, customReason.trim()].filter(Boolean).join(". ");

    return (
        <section className={styles.container}>
            <header className={styles.header_cons}>
                <span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="2" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M2 9.5H16M5 14.5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="18" cy="16" r="5" fill="white" stroke="currentColor" strokeWidth="2" />
                        <path d="M18 13.5V16L19.5 17.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h1>Pending Payments</h1>
                </span>
            </header>

            <div className={styles.status}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitleGroup}><h2>Payment Requests</h2></span>
                    <button
                        className={styles.button_download}
                        disabled={isLoading}
                        onClick={() => {
                            setPage(1);
                            setRefreshKey((key) => key + 1);
                        }}
                    >
                        Refresh
                    </button>
                </div>
                <p className={styles.sectionDescription}>Review submitted payment information before approving or declining it.</p>

                <div className={styles.search}>
                    <label htmlFor="payment-status-filter">Filter requests</label>
                    <select
                        id="payment-status-filter"
                        value={paymentFilter}
                        disabled={isLoading}
                        onChange={(event) => {
                            setPaymentFilter(event.target.value as PaymentFilter);
                            setPage(1);
                        }}
                    >
                        <option value="all">All Requests</option>
                        <option value="declined">Declined</option>
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="refund_requested">Refund Requested</option>
                    </select>
                </div>

                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Email</th>
                                <th>Account Number</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Plan</th>
                                <th>VAT</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                        {Array.from({ length: 8 }).map((__, columnIndex) => (
                                            <td key={columnIndex}><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        ))}
                                        <td><span className={styles.skeletonIconSm} /></td>
                                    </tr>
                                ))
                            ) : payments.length > 0 ? (
                                payments.map((payment, index) => (
                                    <tr key={`${payment.id ?? payment.account_number ?? payment.email ?? "payment"}-${index}`}>
                                        <td>{formatPaymentDate(payment.created_at)}</td>
                                        <td>{payment.email ?? "—"}</td>
                                        <td>{payment.account_number ?? "—"}</td>
                                        <td>{payment.amount ?? "—"}</td>
                                        <td>{payment.method ?? "—"}</td>
                                        <td>{payment.plan_type ?? "—"}</td>
                                        <td>{payment.vat ?? "—"}</td>
                                        <td><span className={`${styles.statusBadge} ${getStatusStyle(payment.status)}`}>{formatStatus(payment.status)}</span></td>
                                        <td><button className={styles.button_view} onClick={() => openPayment(payment)}>View</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={9} className={styles.emptyState}>{error || "No payments found."}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.pagination}>
                    <button className={styles.pageButton} disabled={isLoading || page <= 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>Previous</button>
                    <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                    <button className={styles.pageButton} disabled={isLoading || page >= totalPages} onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}>Next</button>
                </div>
            </div>

            {viewingPayment && (
                <div className={styles.modalOverlay} onClick={() => setViewingPayment(null)}>
                    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Payment details</h3>
                            <button className={styles.modalClose} onClick={() => setViewingPayment(null)} aria-label="Close payment details">×</button>
                        </div>
                        {!showDeclinePanel && (
                            <div className={styles.modalBody}>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Email</span><span>{viewingPayment.email ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Account Number</span><span>{viewingPayment.account_number ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Amount</span><span>{viewingPayment.amount ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Method</span><span>{viewingPayment.method ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Plan</span><span>{viewingPayment.plan_type ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>VAT</span><span>{viewingPayment.vat ?? "—"}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Date</span><span>{formatPaymentDate(viewingPayment.created_at)}</span></div>
                                <div className={styles.detailRow}><span className={styles.detailLabel}>Status</span><span className={`${styles.statusBadge} ${getStatusStyle(viewingPayment.status)}`}>{formatStatus(viewingPayment.status)}</span></div>
                                {viewingPayment.reason && <div className={styles.detailRow}><span className={styles.detailLabel}>Decline Reason</span><span>{viewingPayment.reason}</span></div>}
                            </div>
                        )}

                        {(isPending(viewingPayment.status) || isRefundRequested(viewingPayment.status)) && (showDeclinePanel ? (
                            <div className={styles.modalBody_decline}>
                                <p className={styles.declineTitle}>Select reason(s) for declining</p>
                                <div className={styles.reasonList}>
                                    {DECLINE_REASONS.map((reason) => (
                                        <label key={reason} className={`${styles.reasonOption} ${selectedReasons.includes(reason) ? styles.reasonOptionChecked : ""}`}>
                                            <input type="checkbox" checked={selectedReasons.includes(reason)} onChange={() => toggleReason(reason)} />
                                            <span>{reason}</span>
                                        </label>
                                    ))}
                                </div>
                                <label className={styles.reasonOtherRow}>
                                    <span className={styles.detailLabel}>Other reason</span>
                                    <input className={styles.reasonOtherInput} type="text" placeholder="Additional details" value={customReason} onChange={(event) => setCustomReason(event.target.value)} />
                                </label>
                                <div className={styles.modalFooter}>
                                    <button className={styles.button_accept} onClick={() => setShowDeclinePanel(false)}>Back</button>
                                    <button className={styles.button_decline} disabled={!declineReason} onClick={() => updateDisplayedPayment("declined", declineReason)}>Confirm Decline</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.modalFooter}>
                                <button className={styles.button_decline} onClick={() => setShowDeclinePanel(true)}>Decline</button>
                                {isRefundRequested(viewingPayment.status) ? (
                                    <button className={styles.button_accept} onClick={() => updateDisplayedPayment("refunded")}>Accept Refund</button>
                                ) : (
                                    <button className={styles.button_accept} onClick={() => updateDisplayedPayment("success")}>Approve</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
