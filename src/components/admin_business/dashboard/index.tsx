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

interface ManageUserDataProps {
    created_at?: string;
    email?: string;
    f_name?: string;
    id?: number;
    status?: string;
    year?: string;
}

interface System_logs {
    request?: string;
    created_at?: string;
    uploaded_pdf: number;
    api_request: number;
}

interface WeeklyPoint {
    name: string;
    value: number;
}

type DashboardProps = {
    email: string;
}

type GraphRange = "day" | "week" | "year";

export default function Dashboard({ email } : DashboardProps) {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);
    const [graphRange, setGraphRange] = useState<GraphRange>("week");
    const [animatedStats, setAnimatedStats] = useState({
        accounts: 0,
        uploadedPdf: 0,
        userApi: 0,
        chatbotApi: 0,
    });

    useEffect(() => {
        const RetrieveUserData = async () => {
            const cacheKey = "admin_dashboard_cache_v1";
            const cacheTtlMs = 1000 * 60 * 3; // 3 minutes

            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw) as {
                        at: number;
                        users: ManageUserDataProps[];
                        logs: System_logs[];
                    };

                    if (Date.now() - cached.at < cacheTtlMs) {
                        setData(Array.isArray(cached.users) ? cached.users : []);
                        setSystem_logs(Array.isArray(cached.logs) ? cached.logs : []);
                        return;
                    }
                }
            } catch {
                // Ignore cache parse errors and fetch fresh data.
            }

            const response = await Fetch_to(api_link.admin.retrieve_user, { email: email });
            const response2 = await Fetch_to(api_link.admin.system_logs, { email: email });
            if (response.success && response2.success) {
                const users = response.data.message ?? [];
                const logs = response2.data.message ?? [];
                setData(users);
                setSystem_logs(logs);

                try {
                    localStorage.setItem(
                        cacheKey,
                        JSON.stringify({
                            at: Date.now(),
                            users,
                            logs,
                        })
                    );
                } catch {
                    // Ignore storage quota/permission errors.
                }
            }
        };
        RetrieveUserData();
        
    }, []);


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

    data.forEach((user) => {
        if (!user.created_at) return;
        
        if (graphRange === "week" && isInCurrentWeek(user.created_at)) {
            userSeries[getDayOfWeek(user.created_at)] += 1;
        }
        if (graphRange === "year" && isInCurrentYear(user.created_at)) {
            userSeries[getMonth(user.created_at)] += 1;
        }
    });

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

    const adminApiRequestCount = system_logs.reduce((total, log) => {
        if (log.request === "admin@admin.com") {
            return total + Number(log.api_request ?? 0);
        }
        return total;
    }, 0);

    useEffect(() => {
        const durationMs = 3000;
        const start = performance.now();
        const startValues = { ...animatedStats };
        const targetValues = {
            accounts: data.length,
            uploadedPdf: uploadedPdfCount,
            userApi: apiRequestCount,
            chatbotApi: adminApiRequestCount,
        };

        let rafId = 0;

        const animate = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setAnimatedStats({
                accounts: Math.round(startValues.accounts + (targetValues.accounts - startValues.accounts) * easeOut),
                uploadedPdf: Math.round(startValues.uploadedPdf + (targetValues.uploadedPdf - startValues.uploadedPdf) * easeOut),
                userApi: Math.round(startValues.userApi + (targetValues.userApi - startValues.userApi) * easeOut),
                chatbotApi: Math.round(startValues.chatbotApi + (targetValues.chatbotApi - startValues.chatbotApi) * easeOut),
            });

            if (progress < 1) {
                rafId = requestAnimationFrame(animate);
            }
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [data.length, uploadedPdfCount, apiRequestCount, adminApiRequestCount]);

    const usagePieData = [
        { name: "PDF Uploads", value: uploadedPdfCount },
        { name: "Chatbot", value: adminApiRequestCount },
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
                            
                            <p> {animatedStats.uploadedPdf} </p>
                        </span>
                    </div>
                    
                    <div>
                        <h3>Chatbot API Requested</h3>
                        
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
                </div>
                <section className={styles.analytics_data}>
                    <div className={styles.graph_container}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 className={styles.reportTitle}>Reports</h3>
                            <select
                                value={graphRange}
                                onChange={(e) => setGraphRange(e.target.value as GraphRange)}
                            >
                                <option value="week">Week</option>
                                <option value="year">Year</option>
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
                    </div>
                </section>
                
            </section>
           
            
        </section>
    );

}