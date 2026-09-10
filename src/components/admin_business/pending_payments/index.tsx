"use client";
import { useEffect, useState } from "react";
import styles from "./css/styles.module.css";
import { Fetch_to, SweetAlert2 } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { maskAccountNumber } from "@/lib/payment-account";

type Payment = {
    account_number?: string | number | null;
    amount?: string | number | null;
    created_at?: string | null;
    email?: string | null;
    id?: string | number | null;
    method?: string | null;
    reason?: string | null;
    status?: string | null;
    vat?: string | number | null;
};

type PendingPaymentsProps = {
    email: string;
};

const PAGE_SIZE = 30;

const getStatusStyle = (status?: string | null) => {
    const normalizedStatus = status?.trim().toLowerCase() ?? "pending";

    if (["decline", "declined", "failed", "failure", "rejected"].includes(normalizedStatus)) {
        return styles.statusDeclined;
    }

    if (["success", "successful", "paid", "active", "completed", "complete"].includes(normalizedStatus)) {
        return styles.statusSuccess;
    }

    return styles.statusPending;
};

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
    const [requestingRefundId, setRequestingRefundId] = useState<string | number | null>(null);
    const [resubmittingPayment, setResubmittingPayment] = useState<Payment | null>(null);
    const [resubmitInfo, setResubmitInfo] = useState({ account_number: "", method: "", specify_method: "" });
    const [resubmitError, setResubmitError] = useState("");

    useEffect(() => {
        if (!email) return;

        let isCurrentRequest = true;

        const retrievePayments = async () => {
            setIsLoading(true);
            setError("");

            const response = await Fetch_to(api_link.payment.retrieve, {
                email,
                page,
                limit: PAGE_SIZE,
                search: "",
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
    }, [email, page, refreshKey]);

    const openResubmitDialog = (payment: Payment) => {
        const knownMethods = ["Gcash", "Paymaya", "Maribank", "Gotyme"];
        const currentMethod = payment.method?.trim() ?? "";

        setResubmittingPayment(payment);
        setResubmitError("");
        setResubmitInfo({
            account_number: String(payment.account_number ?? "").includes("*") ? "" : String(payment.account_number ?? ""),
            method: knownMethods.includes(currentMethod) ? currentMethod : currentMethod ? "Other" : "",
            specify_method: knownMethods.includes(currentMethod) ? "" : currentMethod,
        });
    };

    const closeResubmitDialog = () => {
        if (requestingRefundId == null) setResubmittingPayment(null);
    };

    const submitResubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (resubmittingPayment?.id == null || requestingRefundId != null) return;

        const method = resubmitInfo.method === "Other" ? resubmitInfo.specify_method.trim() : resubmitInfo.method;
        if (!resubmitInfo.account_number.trim() || !method) {
            setResubmitError("Please enter an account number and payment method.");
            return;
        }

        setRequestingRefundId(resubmittingPayment.id);
        setResubmitError("");
        setError("");

        const response = await Fetch_to(api_link.payment.resubmit, {
            paymentId: resubmittingPayment.id,
            account_number: resubmitInfo.account_number.trim(),
            method,
            email
        });

        if (response.success) {
            setPayments((currentPayments) => currentPayments.map((currentPayment) =>
                currentPayment.id === resubmittingPayment.id
                    ? { ...currentPayment, account_number: maskAccountNumber(resubmitInfo.account_number.trim()), method, reason: null, status: "pending" }
                    : currentPayment
            ));
            setResubmittingPayment(null);
        } else {
            setResubmitError(response.message ?? "Unable to resubmit payment details.");
        }

        setRequestingRefundId(null);
    };

    const submitRefund = async () => {
        if (resubmittingPayment?.id == null || requestingRefundId != null) return;

        const method = resubmitInfo.method === "Other" ? resubmitInfo.specify_method.trim() : resubmitInfo.method;
        if (!resubmitInfo.account_number.trim() || !method) {
            setResubmitError("Please enter an account number and payment method.");
            return;
        }

        const alert2 = await SweetAlert2("Request a refund", "Are you sure you want to request a refund?", "warning", true, "Yes", true, "No");
        if (!alert2.isConfirmed) return;

        setRequestingRefundId(resubmittingPayment.id);
        setResubmitError("");
        setError("");

        const response = await Fetch_to(api_link.payment.refund, {
            paymentId: resubmittingPayment.id,
            account_number: resubmitInfo.account_number.trim(),
            method,
            email,
        });

        if (response.success) {
            setPayments((currentPayments) => currentPayments.map((currentPayment) =>
                currentPayment.id === resubmittingPayment.id
                    ? { ...currentPayment, account_number: maskAccountNumber(resubmitInfo.account_number.trim()), method, status: "refund_requested" }
                    : currentPayment
            ));
            setResubmittingPayment(null);
        } else {
            setResubmitError(response.message ?? "Unable to request a refund.");
        }

        setRequestingRefundId(null);
    };

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
                    <span className={styles.sectionTitleGroup}>
                        <h2>Payment History</h2>
                    </span>
                    <button
                        className={styles.button_download}
                        disabled={isLoading || !email}
                        onClick={() => {
                            setPage(1);
                            setRefreshKey((key) => key + 1);
                        }}
                    >
                        Refresh
                    </button>
                </div>
                <p className={styles.sectionDescription}>
                    Track your payment requests. A declined payment shows the reason so you can correct the information and submit it again. Declined payments are red, pending payments are yellow, and successful payments are green.
                </p>

                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account Number</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>VAT</th>
                                <th>Status</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonShort}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonShort}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonShort}`} /></td>
                                        <td><span className={`${styles.skeletonBar} ${styles.skeletonMedium}`} /></td>
                                    </tr>
                                ))
                            ) : payments.length > 0 ? (
                                payments.map((payment, index) => (
                                    <tr key={`${payment.account_number ?? payment.email ?? "payment"}-${index}`}>
                                        <td>{formatPaymentDate(payment.created_at)}</td>
                                        <td>{payment.account_number ?? "—"}</td>
                                        <td>{payment.amount ?? "—"}</td>
                                        <td>{payment.method ?? "—"}</td>
                                        <td>{payment.vat ?? "—"}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${getStatusStyle(payment.status)}`}>
                                                {formatStatus(payment.status)}
                                            </span>
                                        </td>
                                        <td>{payment.reason ?? "—"}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={styles.refundButton}
                                                disabled={payment.id == null || requestingRefundId != null || payment.status?.trim().toLowerCase() === "refund_requested" || payment.status?.trim().toLowerCase() === "success"}
                                                onClick={() => openResubmitDialog(payment)}
                                            >
                                                {payment.status?.trim().toLowerCase() === "refund_requested" ? "Refund requested" : "Update request"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        {error || "No payments found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.pagination}>
                    <button
                        className={styles.pageButton}
                        disabled={isLoading || page <= 1}
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    >
                        Previous
                    </button>
                    <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                    <button
                        className={styles.pageButton}
                        disabled={isLoading || page >= totalPages}
                        onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>

            {resubmittingPayment && (
                <div className={styles.refundOverlay} onClick={closeResubmitDialog}>
                    <div className={styles.refundCard} role="dialog" aria-modal="true" aria-labelledby="refund-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.refundHeader}>
                            <div>
                                <p className={styles.refundEyebrow}>Correct payment details</p>
                                <h2 id="refund-title">Resubmit payment</h2>
                            </div>
                            <button type="button" className={styles.refundClose} onClick={closeResubmitDialog} disabled={requestingRefundId != null} aria-label="Close resubmit details">×</button>
                        </div>
                        <p className={styles.refundIntro}>Correct your account number or payment method, then resubmit the payment for review.</p>
                        <form className={styles.refundForm} onSubmit={submitResubmission}>
                            <label htmlFor="refund-method">Payment method</label>
                            <select id="refund-method" name="method" value={resubmitInfo.method} onChange={(event) => setResubmitInfo((current) => ({ ...current, method: event.target.value }))}>
                                <option value="">Select a payment method</option>
                                <option value="Gcash">GCash</option>
                                <option value="Paymaya">PayMaya</option>
                                <option value="Maribank">MariBank</option>
                                <option value="Gotyme">GoTyme</option>
                                <option value="Other">Other bank</option>
                            </select>
                            {resubmitInfo.method === "Other" && (
                                <>
                                    <label htmlFor="refund-specify-method">Bank name</label>
                                    <input id="refund-specify-method" value={resubmitInfo.specify_method} onChange={(event) => setResubmitInfo((current) => ({ ...current, specify_method: event.target.value }))} placeholder="Specify your bank" />
                                </>
                            )}
                            <label htmlFor="refund-account-number">Account number</label>
                            <input id="refund-account-number" value={resubmitInfo.account_number} onChange={(event) => setResubmitInfo((current) => ({ ...current, account_number: event.target.value }))} inputMode="numeric" placeholder="Enter your account number" />
                            {resubmitError && <p className={styles.refundError} role="alert">{resubmitError}</p>}
                            <div className={styles.refundActions}>
                                <button type="button" className={styles.cancelRefundBtn} onClick={closeResubmitDialog} disabled={requestingRefundId != null}>Cancel</button>
                                <button type="submit" className={styles.submitRefundBtn} disabled={requestingRefundId != null}>{requestingRefundId != null ? "Submitting..." : "Resubmit payment"}</button>
                                <button type="button" className={styles.refundButton} onClick={submitRefund} disabled={requestingRefundId != null}>{requestingRefundId != null ? "Submitting..." : "Request refund"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
