"use client";
import styles from "./css/styles.module.css";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { Fetch_to } from "@/utilities";
import  api_link from "@/config/conf/json_config/fetch_url.json";


type System_logs = {
    request?: string;
    created_at?: string;
    uploaded_pdf: number;
    api_request: number;
}

type WeeklyPoint = {
    name: string;
    value: number;
}

type CurrentFiles = {
    id?: number;
}

type DashboardProps = {
    email: string;
    current_plan: string;
    current_pdf_limit: number;
    current_pdf_limit_per_mb: number;
    current_limit: number;
}

const PRICING_TIERS = [
    {
        id: "free",
        name: "Free Trial",
        price: "₱0",
        period: "/month",
        tagline: "Get started with the basics",
        features: [
            "2 PDF uploads limit",
            "10,000 API requests limit",
            "10mb per upload",
            "Customize chatbot",
            "Embedded link access",
            "1 Month free trial"
        ],
        cta: "Current Plan",
        highlight: false,
    },
    {
        id: "pro",
        name: "Pro",
        price: "₱599",
        period: "/month",
        tagline: "For MSME's business and power users",
        features: [
            "250 PDF uploads / month",
            "500,000 API requests / month",
            "100MB per upload",
            "Customize chatbot",
            "Embedded link access",
            "Good for MSME's"
        ],
        cta: "Upgrade to Pro",
        highlight: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "",
        tagline: "For School/University and Big Interprises",
        features: [
            "Everything is Unlimited",
            "Customize OpenAI Version",
            "Can have user manager",
            "Recommended for School/University",
            "Can Handle Sensitive PDF file"
        ],
        cta: "Contact Sales",
        highlight: false,
    },
];


// Helper to clamp percentage 0-100
const getUsagePercent = (used: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(Math.round((used / max) * 100), 100);
};

type GraphRange = "day" | "week" | "year";

export default function Dashboard({ email, current_limit, current_pdf_limit, current_plan } : DashboardProps) {
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);
    const [files, setFiles] = useState<CurrentFiles[]>([]);
    const [graphRange, setGraphRange] = useState<GraphRange>("week");
    const [animatedStats, setAnimatedStats] = useState({
        uploadedPdf: 0,
        chatbotApi: 0,
        currentFile: 0,
    });
    const [showPricing, setShowPricing] = useState(false);

    useEffect(() => {
        const Retrieve = async () => {
            const response1 = await Fetch_to(api_link.storage.retrieve_chatbot, { email });
            if (response1.success) {
                setFiles(response1.data.message);
                const response2 = await Fetch_to(api_link.admin.system_logs, { email });
                if (response2.success) {
                    setSystem_logs(response2.data.message ?? []);
                    
                }
            }
        };
        Retrieve();
        const Retrieve2 = async () => {
            
        };
        Retrieve2();
    }, [email]);


    function getDayOfWeek(dateString: string) {
        return new Date(dateString).getDay(); // 0 Sun, 1 Mon, ...
    }

    function getMonth(dateString: string) {
        return new Date(dateString).getMonth(); // 0 Jan, 1 Feb, ...
    }

    function isInCurrentWeek(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return date >= startOfWeek && date <= endOfWeek;
    }

    function isInCurrentYear(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        return date.getFullYear() === now.getFullYear();
    }

    function isInCurrentDay(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        return (
            date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate()
        );
    }

    function getHour(dateString: string) {
        return new Date(dateString).getHours();
    }

    const userSeries = graphRange === "day"
        ? Array.from({ length: 24 }, () => 0)
        : graphRange === "week"
            ? Array.from({ length: 7 }, () => 0)
            : Array.from({ length: 12 }, () => 0);

    const pdfSeries = [...userSeries];
    const apiSeries = [...userSeries];

    system_logs.forEach((entry) => {
        if (!entry.created_at) return;
        if (graphRange === "day" && isInCurrentDay(entry.created_at)) {
            const hour = getHour(entry.created_at);
            pdfSeries[hour] += entry.uploaded_pdf ?? 0;
            apiSeries[hour] += entry.api_request ?? 0;
        }
        if (graphRange === "week" && isInCurrentWeek(entry.created_at)) {
            const day = getDayOfWeek(entry.created_at);
            pdfSeries[day] += entry.uploaded_pdf ?? 0;
            apiSeries[day] += entry.api_request ?? 0;
        }
        if (graphRange === "year" && isInCurrentYear(entry.created_at)) {
            const month = getMonth(entry.created_at);
            pdfSeries[month] += entry.uploaded_pdf ?? 0;
            apiSeries[month] += entry.api_request ?? 0;
        }
    });

    const toPeriodSet = (series: number[]): WeeklyPoint[] => {

        if (graphRange === "week") {
            return [
                { name: "Sun", value: series[0] },
                { name: "Mon", value: series[1] },
                { name: "Tue", value: series[2] },
                { name: "Wed", value: series[3] },
                { name: "Thu", value: series[4] },
                { name: "Fri", value: series[5] },
                { name: "Sat", value: series[6] },
            ];
        }

        return [
            { name: "Jan", value: series[0] },
            { name: "Feb", value: series[1] },
            { name: "Mar", value: series[2] },
            { name: "Apr", value: series[3] },
            { name: "May", value: series[4] },
            { name: "Jun", value: series[5] },
            { name: "Jul", value: series[6] },
            { name: "Aug", value: series[7] },
            { name: "Sep", value: series[8] },
            { name: "Oct", value: series[9] },
            { name: "Nov", value: series[10] },
            { name: "Dec", value: series[11] },
        ];
    };

    const Pdf_set = toPeriodSet(pdfSeries);
    const Api_logs = toPeriodSet(apiSeries);
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const { uploadedPdfCount, apiRequestCount } = system_logs.reduce(
        (totals, log) => {
            totals.uploadedPdfCount += Number(log.uploaded_pdf ?? 0);
            totals.apiRequestCount += Number(log.api_request ?? 0);
            return totals;
        },
        { uploadedPdfCount: 0, apiRequestCount: 0 }
    );

    useEffect(() => {
        const durationMs = 3000;
        const start = performance.now();
        const startValues = { ...animatedStats };
        const targetValues = {
            uploadedPdf: uploadedPdfCount,
            chatbotApi: apiRequestCount,
            currentFile: files.length
        };

        let rafId = 0;

        const animate = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setAnimatedStats({
                uploadedPdf: Math.round(startValues.uploadedPdf + (targetValues.uploadedPdf - startValues.uploadedPdf) * easeOut),
                chatbotApi: Math.round(startValues.chatbotApi + (targetValues.chatbotApi - startValues.chatbotApi) * easeOut),
                currentFile: Math.round(startValues.currentFile + (targetValues.currentFile - startValues.currentFile) * easeOut)
            });

            if (progress < 1) {
                rafId = requestAnimationFrame(animate);
            }
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [uploadedPdfCount, apiRequestCount]);

    const usagePieData = [
        { name: "PDF Uploads", value: uploadedPdfCount },
        { name: "API Request", value: apiRequestCount },
    ];
    const pieColors = ["#2563eb", "#f59e0b", "#16c784", "#ff0800"];

    const renderCryptoChart = (title: string, chartData: WeeklyPoint[], chartId: string, trendLabel: string) => {
        const firstValue = chartData[0]?.value ?? 0;
        const lastValue = chartData[chartData.length - 1]?.value ?? 0;
        const isUp = lastValue >= firstValue;
        const strokeColor = isUp ? "#1642c7" : "#d4294e";
        const gradientTop = isUp ? "rgba(22, 122, 199, 0.45)" : "rgba(234, 57, 75, 0.45)";
        const gradientBottom = isUp ? "rgba(22, 199, 132, 0.03)" : "rgba(234, 57, 67, 0.03)";

        return (
            <section className={styles.graph}>
                <div className={styles.chartHeader}>
                    <h2>{title}</h2>
                    <span className={isUp ? styles.trendUp : styles.trendDown}>
                        {isUp ? `${trendLabel} up` : `${trendLabel} down`}
                    </span>
                </div>
                <div className={styles.info2}>
                    <div className={styles.chartShell}>
                        <ResponsiveContainer width="100%" height={270}>
                            <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={gradientTop} />
                                        <stop offset="100%" stopColor={gradientBottom} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(16, 56, 108, 0.5)" strokeDasharray="5 5" />
                                <XAxis dataKey="name" tick={{ fill: "#3b5b9a", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#4c5f85", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(175, 188, 219, 0.94)",
                                        border: `1px solid ${strokeColor}`,
                                        borderRadius: "8px",
                                        color: "#000000",
                                    }}
                                    formatter={(value) => [`${value}`, "Count"]}
                                    labelStyle={{ color: "#101113" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={strokeColor}
                                    strokeWidth={3}
                                    fill={`url(#${chartId})`}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        );
    };

    return(
        <section className={styles.container}>

            <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    </svg> 
                    <h1>Dashboard</h1>
                </span>

                <button
                    type="button"
                    className={styles.upgradeBtn}
                    onClick={() => setShowPricing(true)}
                >
                    Upgrade Plan
                </button>
            </header>

            <section className={styles.status}>
                <div className={styles.statusHeader}>
                    <h2>System Usage Overview</h2>
                    <p>{currentDate}</p>
                </div>
                <div className={styles.info}>
                    <div>
                        <h3>Number of PDF uploaded</h3>
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/>
                                <text x="6" y="18" fontSize="6" fill="currentColor">PDF</text>
                                </svg>
                            </span>
                            
                            <p> {animatedStats.currentFile} </p>
                        </span>
                    </div>
                    
                    <div>
                        <h3>API Requested</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="11" r="2" fill="currentColor"/>
                                <circle cx="15" cy="11" r="2" fill="currentColor"/>
                                <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            
                            <p> {animatedStats.chatbotApi} </p>
                        </span>
                    </div>

                    <div>
                        <h3>Current Plan</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                {/* Badge / shield icon - represents a subscription tier */}
                                <svg width="34" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2l7 3v6c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V5l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            
                            <p> {current_plan} </p>
                        </span>
                    </div>
                </div>
                <section className={styles.analytics_data}>
                    <div className={styles.graph_container}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 className={styles.reportTitle}>Reports</h3>
                            <select
                                value={graphRange}
                                onChange={(e) => setGraphRange(e.target.value as GraphRange)}
                            >
                                <option value="week">Weekly</option>
                                <option value="year">Monthly</option>
                            </select>
                        </div>

                        {renderCryptoChart(`Number of PDF`, Pdf_set, "pdfTrend", graphRange)}
                        {renderCryptoChart(`AI API Requested`, Api_logs, "apiTrend", graphRange)}
                    </div>
                    <div className={styles.records}>
                        <h3 className={styles.reportTitle}>Overall Usage</h3>
                        <div className={styles.pieCard}>
                            <h3>Usage Breakdown</h3>
                            <div className={styles.pieShell}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={usagePieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={1}
                                        >
                                            {usagePieData.map((entry, index) => (
                                                <Cell key={`cell-${entry.name}`} fill={pieColors[index % pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "rgba(186, 199, 229, 0.94)",
                                                border: "1px solid rgba(22, 122, 199, 0.4)",
                                                borderRadius: "8px",
                                                color: "#000000",
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className={styles.limitBars}>
                            
                            <div className={styles.limitRow}>
                                
                                <div className={styles.limitLabelRow}>
                                    <span>PDF Uploads</span>
                                    <span className={styles.limitValue}>
                                        {animatedStats.currentFile} / {current_pdf_limit}
                                    </span>
                                </div>
                                <div className={styles.limitTrack}>
                                    <div
                                        className={`${styles.limitFill} ${
                                            getUsagePercent(animatedStats.currentFile, current_pdf_limit) >= 90
                                                ? styles.limitDanger
                                                : getUsagePercent(animatedStats.currentFile, current_pdf_limit) >= 70
                                                    ? styles.limitWarning
                                                    : ""
                                        }`}
                                        style={{ width: `${getUsagePercent(animatedStats.currentFile, current_pdf_limit)}%` }}
                                    />
                                </div>
                            </div>

                            <div className={styles.limitRow}>
                                <div className={styles.limitLabelRow}>
                                    <span>API Requests</span>
                                    <span className={styles.limitValue}>
                                        {animatedStats.chatbotApi} / {current_limit}
                                    </span>
                                </div>
                                <div className={styles.limitTrack}>
                                    <div
                                        className={`${styles.limitFill} ${
                                            getUsagePercent(animatedStats.chatbotApi, current_limit) >= 90
                                                ? styles.limitDanger
                                                : getUsagePercent(animatedStats.chatbotApi, current_limit) >= 70
                                                    ? styles.limitWarning
                                                    : ""
                                        }`}
                                        style={{ width: `${getUsagePercent(animatedStats.chatbotApi, current_limit)}%` }}
                                    />
                                    
                                </div>
                            </div>
                            
                        </div>

                    </div>
                    
                </section>
                
            </section>
           {showPricing && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowPricing(false)}
                >
                    <div
                        className={styles.modalCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2>Choose your plan</h2>
                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={() => setShowPricing(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.tiersGrid}>
                            {PRICING_TIERS.map((tier) => (
                                <div
                                    key={tier.id}
                                    className={`${styles.tierCard} ${tier.highlight ? styles.tierHighlight : ""}`}
                                >
                                    {tier.highlight && (
                                        <span className={styles.popularBadge}>Most Popular</span>
                                    )}
                                    <h3>{tier.name}</h3>
                                    <p className={styles.tierPrice}>
                                        {tier.price}
                                        <span>{tier.period}</span>
                                    </p>
                                    <p className={styles.tierTagline}>{tier.tagline}</p>
                                    <ul className={styles.tierFeatures}>
                                        {tier.features.map((f) => (
                                            <li key={f}>{f}</li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        className={tier.highlight ? styles.tierCtaPrimary : styles.tierCtaSecondary}
                                    >
                                        {tier.cta}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
        </section>
    );

}