"use client";
import styles from "./css/styles.module.css";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Fetch_to, Progress } from "@/utilities";
import apiLink from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";

type DashboardProps = { email: string; current_plan: string; current_pdf_limit: number; current_pdf_limit_per_mb: number; current_limit: number };
type Range = "week" | "year";
type Point = { name: string; value: number };
type Log = { uploaded_pdf?: number; api_request?: number; created_at?: string };

const PRICING_TIERS = [
    { id: "free", name: "Free Trial", price: "₱0", period: "/month", tagline: "Get started with the basics", features: ["2 PDF uploads limit", "10,000 API requests limit", "10 MB per upload", "Customize chatbot", "Embedded link access", "1 month free trial"], cta: "Current Plan", highlight: false },
    { id: "pro", name: "Pro", price: "₱799", period: "/month", tagline: "For MSMEs and power users", features: ["250 PDF uploads limit", "1,000,000 API requests / week", "100 MB per upload", "Customize chatbot", "Embedded link access", "Great for MSMEs"], cta: "Upgrade to Pro", highlight: true },
    { id: "enterprise", name: "Enterprise", price: "Custom", period: "", tagline: "For schools, universities, and large enterprises", features: ["Full LACO AI feature access", "Limits scale with your OpenAI API budget", "Customize OpenAI version", "User management", "Recommended for schools and universities", "Sensitive PDF support"], cta: "Contact Sales", highlight: false },
];

const percentage = (value: number, limit: number) => limit > 0 ? Math.min(100, Math.round((value / limit) * 100)) : 0;
const number = new Intl.NumberFormat("en-PH");

function UsageCard({ title, used, limit, detail, icon }: { title: string; used: number; limit: number; detail: string; icon: "pdf" | "ai" }) {
    const usedPercent = percentage(used, limit);
    const state = usedPercent >= 90 ? styles.usageDanger : usedPercent >= 70 ? styles.usageWarning : "";
    return <article className={styles.usageCard}>
        <div className={styles.usageCardHeader}><span className={styles.usageIcon}>{icon === "pdf" ? "PDF" : "AI"}</span><span className={styles.usagePercent}>{usedPercent}% used</span></div>
        <h2>{title}</h2><p className={styles.usageNumbers}><strong>{number.format(used)}</strong><span> / {number.format(limit)}</span></p>
        <div className={styles.usageTrack} aria-label={`${title}: ${usedPercent}% used`}><span className={`${styles.usageFill} ${state}`} style={{ width: `${usedPercent}%` }}/></div>
        <p className={styles.usageDetail}>{detail}</p>
    </article>;
}

function UsageTrend({ title, data, color }: { title: string; data: Point[]; color: string }) {
    const hasData = data.some((point) => point.value > 0);
    const gradientId = `usage-fill-${title.replaceAll(" ", "-").toLowerCase()}`;
    return <section className={styles.graph}>
        <div className={styles.chartHeader}><h2>{title}</h2><span className={hasData ? styles.trendUp : styles.trendDown}>{hasData ? "Live data" : "No activity yet"}</span></div>
        <div className={styles.chartShell}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 10, left: -16, bottom: 2 }}>
            <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.38}/><stop offset="100%" stopColor={color} stopOpacity={.02}/></linearGradient></defs>
            <CartesianGrid stroke="rgba(16,56,108,.16)" strokeDasharray="4 4" vertical={false}/>
            <XAxis dataKey="name" tick={{ fill: "#4c5f85", fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: "#4c5f85", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip formatter={(value) => [Number(value).toLocaleString(), title]} contentStyle={{ borderRadius: 10, border: "1px solid #dbe4f0" }}/>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`}/>
        </AreaChart></ResponsiveContainer></div>
    </section>;
}

function usageHistory(logs: Log[], range: Range, field: "uploaded_pdf" | "api_request"): Point[] {
    const now = new Date();
    if (range === "week") {
        return Array.from({ length: 7 }, (_, index) => {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - 6 + index);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const value = logs.reduce((total, log) => {
                const date = log.created_at ? new Date(log.created_at) : null;
                return date && date >= start && date < end ? total + Number(log[field] ?? 0) : total;
            }, 0);
            return { name: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value };
        });
    }

    return Array.from({ length: 12 }, (_, index) => {
        const period = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
        return {
            name: period.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            value: logs.reduce((total, log) => {
                const date = log.created_at ? new Date(log.created_at) : null;
                return date && date.getFullYear() === period.getFullYear() && date.getMonth() === period.getMonth() ? total + Number(log[field] ?? 0) : total;
            }, 0),
        };
    });
}

export default function Dashboard({ email, current_plan, current_limit, current_pdf_limit, current_pdf_limit_per_mb }: DashboardProps) {
    const router = useRouter();
    const [pdfCount, setPdfCount] = useState(0);
    const [apiCount, setApiCount] = useState(0);
    const [logs, setLogs] = useState<Log[]>([]);
    const [range, setRange] = useState<Range>("week");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [payment, setPayment] = useState({ method: "", otherBank: "", accountNumber: "" });
    const [paymentError, setPaymentError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!email) return;
        let alive = true;
        const updateUsage = async () => {
            const [documents, logs] = await Promise.all([
                Fetch_to(apiLink.storage.retrieve_chatbot, { email, limit: 1 }),
                Fetch_to(apiLink.admin.system_logs, { email }),
            ]);
            if (!alive) return;
            if (documents.success) setPdfCount(Number(documents.data?.total ?? documents.data?.message?.length ?? 0));
            if (logs.success) {
                const usageLogs = logs.data?.message ?? [];
                setLogs(usageLogs);
                setApiCount(usageLogs.reduce((total: number, entry: Log) => total + Number(entry.api_request ?? 0), 0));
            }
            if (documents.success && logs.success) { setError(""); setLastUpdated(new Date()); }
            else setError("Usage data is temporarily unavailable. We will try again automatically.");
        };
        updateUsage();
        const interval = window.setInterval(updateUsage, 5000);
        return () => { alive = false; window.clearInterval(interval); };
    }, [email]);

    const submitUpgrade = async () => {
        const paymentMethod = payment.method === "Other" ? payment.otherBank.trim() : payment.method;
        if (!paymentMethod || !payment.accountNumber.trim()) {
            setPaymentError("Please select a payment method, specify the other bank if needed, and enter your account number.");
            return;
        }
        setSubmitting(true); setPaymentError("");
        const response = await Fetch_to(apiLink.payment.paying, { email, account_number: payment.accountNumber.trim(), method: paymentMethod, plan_type: "Pro" });
        if (response.success) { Progress(true); router.push("/admin_business/pending_payment"); return; }
        setPaymentError(response.message || "Unable to submit payment details."); setSubmitting(false);
    };

    const pdfHistory = usageHistory(logs, range, "uploaded_pdf");
    const apiHistory = usageHistory(logs, range, "api_request");

    return <section className={styles.container}>
        <header className={styles.header_cons}><span><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/></svg><h1>Dashboard</h1></span><button className={styles.upgradeBtn} onClick={() => setShowUpgrade(true)}>Upgrade plan</button></header>
        <section className={styles.workspaceHero}><span className={styles.workspaceEyebrow}>Your workspace</span><h2>Usage at a glance</h2><p>Keep track of your document storage and AI request allowance.</p>{lastUpdated && <small>Updated automatically at {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>}</section>
        {error && <p className={styles.usageError}>{error}</p>}
        <section className={styles.userUsageGrid}>
            <UsageCard title="PDF uploads" used={pdfCount} limit={current_pdf_limit} detail={`Each PDF can be up to ${current_pdf_limit_per_mb} MB.`} icon="pdf" />
            <UsageCard title="AI requests" used={apiCount} limit={current_limit} detail="Your usage updates automatically every 5 seconds." icon="ai" />
        </section>
        <p className={styles.usageNote}>Your limits are based on your current plan. Contact support if you need more capacity.</p>
        <section className={styles.businessAnalytics}>
            <div className={styles.businessAnalyticsHeader}><h3>Usage &amp; activity</h3><div className={styles.chartFilters}><select value={range} onChange={(event) => setRange(event.target.value as Range)}><option value="week">Last 7 days</option><option value="year">Last 12 months</option></select></div></div>
            <div className={styles.businessCharts}><UsageTrend title="PDF uploads" data={pdfHistory} color="#2563eb"/><UsageTrend title="AI requests" data={apiHistory} color="#7c3aed"/></div>
        </section>
        {showUpgrade && <div className={styles.modalOverlay} onClick={() => setShowUpgrade(false)}><div className={styles.modalCard} onClick={(event) => event.stopPropagation()}><div className={styles.modalHeader}><h2>Choose your plan</h2><button className={styles.closeBtn} onClick={() => setShowUpgrade(false)} aria-label="Close">✕</button></div><div className={styles.tiersGrid}>{PRICING_TIERS.map((tier) => <article key={tier.id} className={`${styles.tierCard} ${tier.highlight ? styles.tierHighlight : ""}`}>{tier.highlight && <span className={styles.popularBadge}>Most popular</span>}<h3>{tier.name}</h3><p className={styles.tierPrice}>{tier.price}<span>{tier.period}</span></p><p className={styles.tierTagline}>{tier.tagline}</p><ul className={styles.tierFeatures}>{tier.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button className={tier.highlight ? styles.tierCtaPrimary : styles.tierCtaSecondary} disabled={current_plan === tier.name} onClick={() => { if (tier.id === "pro") { setShowUpgrade(false); setShowPayment(true); } }}>{current_plan === tier.name ? "Current Plan" : tier.cta}</button></article>)}</div></div></div>}
        {showPayment && <div className={styles.paymentOverlay} onClick={() => setShowPayment(false)}><div className={styles.paymentCard} onClick={(event) => event.stopPropagation()}><div className={styles.modalHeader}><div><p className={styles.paymentEyebrow}>Pro plan · ₱799/month</p><h2>Payment details</h2></div><button className={styles.closeBtn} onClick={() => setShowPayment(false)} aria-label="Close">✕</button></div><p className={styles.paymentIntro}>Scan the QR code to pay, then enter the details from the payment account you used.</p><div className={styles.qrPayment}><Image src="/QR_Gcash.png" alt="InstaPay payment QR code" width={120} height={120}/><div><h3>Scan to pay</h3><p>Use your preferred banking or e-wallet app to scan this InstaPay QR code.</p></div></div><div className={styles.paymentForm}><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={payment.method} onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value, otherBank: event.target.value === "Other" ? current.otherBank : "" }))}><option value="">Select a payment method</option><option value="Gcash">GCash</option><option value="Paymaya">PayMaya</option><option value="Maribank">MariBank</option><option value="Gotyme">GoTyme</option><option value="Other">Other bank</option></select>{payment.method === "Other" && <><label htmlFor="other-bank">Bank name</label><input id="other-bank" value={payment.otherBank} onChange={(event) => setPayment((current) => ({ ...current, otherBank: event.target.value }))} placeholder="Specify your bank"/></>}<label htmlFor="account-number">Account number</label><input id="account-number" value={payment.accountNumber} inputMode="numeric" onChange={(event) => setPayment((current) => ({ ...current, accountNumber: event.target.value }))} placeholder="Enter your account number"/>{paymentError && <p className={styles.refundError}>{paymentError}</p>}<div className={styles.paymentActions}><button className={styles.cancelPaymentBtn} onClick={() => setShowPayment(false)}>Cancel</button><button className={styles.submitPaymentBtn} disabled={submitting} onClick={submitUpgrade}>{submitting ? "Submitting…" : "Submit payment details"}</button></div></div></div></div>}
    </section>;
}
