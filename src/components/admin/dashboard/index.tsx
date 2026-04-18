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

export default function Dashboard() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [system_logs, setSystem_logs] = useState<System_logs[]>([]);

    useEffect(() => {
        const RetrieveUserData = async () => {
            const response = await Fetch_to(api_link.admin.retrieve_user);
            const response2 = await Fetch_to(api_link.admin.system_logs);
            if (response.success) {
                setData(response.data.message);
                setSystem_logs(response2.data.message);
                console.log(response2.data.message);
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

    const weeklyUsers = [0,0,0,0,0,0,0];

    const weeklyPDF_record = [0,0,0,0,0,0,0];

    const weeklyAPI_logs = [0,0,0,0,0,0,0];

    const monthlyUsers = [0,0,0,0,0,0,0,0,0,0,0,0];

    const monthlyPDF_record = [0,0,0,0,0,0,0,0,0,0,0,0];

    const monthlyAPI_logs = [0,0,0,0,0,0,0,0,0,0,0,0];

    data.forEach(user => {
        if (user.created_at) {
            const day = getDayOfWeek(user.created_at);
            const month = getMonth(user.created_at);
            if (isInCurrentWeek(user.created_at)) {
                weeklyUsers[day]++;
            }
            if (isInCurrentYear(user.created_at)) {
                monthlyUsers[month]++;
            }
        }
    });

    system_logs.forEach((entry) => {
        if (entry.created_at) {
            const day = getDayOfWeek(entry.created_at);
            const month = getMonth(entry.created_at);
            if (isInCurrentWeek(entry.created_at)) {
                weeklyPDF_record[day] += entry.uploaded_pdf ?? 0;
                weeklyAPI_logs[day] += entry.api_request ?? 0;
            }
            if (isInCurrentYear(entry.created_at)) {
                monthlyPDF_record[month] += entry.uploaded_pdf ?? 0;
                monthlyAPI_logs[month] += entry.api_request ?? 0;
            }
        }
    });

    const toWeeklySet = (series: number[]): WeeklyPoint[] => [
        { name: "Sun", value: series[0] },
        { name: "Mon", value: series[1] },
        { name: "Tue", value: series[2] },
        { name: "Wed", value: series[3] },
        { name: "Thu", value: series[4] },
        { name: "Fri", value: series[5] },
        { name: "Sat", value: series[6] },
    ];

    const toMonthlySet = (series: number[]): WeeklyPoint[] => [
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

    const UserSet = toWeeklySet(weeklyUsers);
    const Pdf_set = toWeeklySet(weeklyPDF_record);
    const Api_logs = toWeeklySet(weeklyAPI_logs);

    const UserMonthSet = toMonthlySet(monthlyUsers);
    const PdfMonthSet = toMonthlySet(monthlyPDF_record);
    const ApiMonthSet = toMonthlySet(monthlyAPI_logs);
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const getApiCount = (email?: string) => {
        if (!email) return 0;
        return system_logs.reduce((total, log) => {
            if (log.request === email) {
                return total + Number(log.api_request ?? 0);
            }
            return total;
        }, 0);
    };

    const topApiUsers = [...data]
        .filter((user) => user.email)
        .map((user) => ({
            email: user.email as string,
            count: getApiCount(user.email),
        }))
        .filter((user) => user.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

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

    const usagePieData = [
        { name: "PDF Uploads", value: uploadedPdfCount },
        { name: "User Logs", value: apiRequestCount },
        { name: "Registered Accounts", value: data.length },
        { name: "Chatbot", value: apiRequestCount },
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
                        <h3>Registered Accounts</h3>
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="17" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M2 20c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M13 20c0-2 2-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            
                            <p> {data.length} </p>
                        </span>
                        
                    </div>
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
                            
                            <p> {uploadedPdfCount} </p>
                        </span>
                    </div>
                    <div>
                        <h3>User API Requested</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <path d="M10 6h4M17 10v4M10 18h4M6 10v4" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </span>
                            
                            <p> {apiRequestCount} </p>
                        </span>
                    </div>
                    <div>
                        <h3>Chatbot API Requested</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="11" r="2" fill="currentColor"/>
                                <circle cx="15" cy="11" r="2" fill="currentColor"/>
                                <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            
                            <p> {adminApiRequestCount} </p>
                        </span>
                    </div>
                </div>
                <section className={styles.analytics_data}>
                    <div className={styles.graph_container}>
                        <h3 className={styles.reportTitle}>Weekly Reports</h3>
                        {renderCryptoChart("Registered Accounts this Week", UserSet, "activeAccountsTrend", "Weekly")}
                        {renderCryptoChart("Number of PDF this Week", Pdf_set, "pdfTrend", "Weekly")}
                        {renderCryptoChart("AI API Requested this Week", Api_logs, "apiTrend", "Weekly")}

                        <h3 className={styles.reportTitle}>Monthly Reports</h3>
                        {renderCryptoChart("Registered Accounts Monthly", UserMonthSet, "activeAccountsMonthTrend", "Monthly")}
                        {renderCryptoChart("Number of PDF Monthly", PdfMonthSet, "pdfMonthTrend", "Monthly")}
                        {renderCryptoChart("AI API Requested Monthly", ApiMonthSet, "apiMonthTrend", "Monthly")}
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
                        <h3 className={styles.reportTitle}>Most Top 20 users by Laco AI usage</h3>
                        <table className={styles.rankings}>
                            <thead>
                                <tr>
                                    <th>Top</th>
                                    <th>Email</th>
                                    <th>API Usage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topApiUsers.length > 0 ? (
                                    topApiUsers.map((user, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{user.email}</td>
                                            <td>{user.count}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>No Data</td>
                                    </tr>
                                )}
                                
                            </tbody>
                        </table>
                    </div>
                </section>
                
            </section>
           
            
        </section>
    );

}