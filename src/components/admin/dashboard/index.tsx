"use client";
import styles from "./css/styles.module.css";
import {
    Bar,
    BarChart,
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
import { useState } from "react";

interface WeeklyPoint {
    name: string;
    value: number;
}

type ChartRange = "week" | "year";

type DashboardProps = {
    email: string;
}

export default function Dashboard({ email } : DashboardProps) {
    void email;
    const [chartRange, setChartRange] = useState<ChartRange>("week");
    const weeklyChartData: WeeklyPoint[] = [
        { name: "2026-01-01", value: 0 }, { name: "2026-01-02", value: 0 }, { name: "2026-01-03", value: 0 },
        { name: "2026-01-04", value: 0 }, { name: "2026-01-05", value: 0 }, { name: "2026-01-06", value: 0 },
        { name: "2026-01-07", value: 0 },
    ];
    const yearlyChartData: WeeklyPoint[] = [
        { name: "2026-01-01", value: 0 }, { name: "2026-02-01", value: 0 }, { name: "2026-03-01", value: 0 },
        { name: "2026-04-01", value: 0 }, { name: "2026-05-01", value: 0 }, { name: "2026-06-01", value: 0 },
        { name: "2026-07-01", value: 0 }, { name: "2026-08-01", value: 0 }, { name: "2026-09-01", value: 0 },
        { name: "2026-10-01", value: 0 }, { name: "2026-11-01", value: 0 }, { name: "2026-12-01", value: 0 },
    ];
    const emptyChartData = chartRange === "week" ? weeklyChartData : yearlyChartData;
    const departmentPieData = [
        { name: "SARFAID", value: 0 },
        { name: "SBIT", value: 0 },
        { name: "SHTM", value: 0 },
        { name: "SHTM", value: 0 },
    ];
    const accountTypePieData = [
        { name: "Students", value: 0 },
        { name: "Teachers", value: 0 },
    ];
    const businessAccountPieData = [
        { name: "Business Accounts", value: 0 },
    ];
    const pieColors = ["#2563eb", "#f59e0b", "#16c784", "#ff0800"];

    const renderHistogram = (title: string, chartData: WeeklyPoint[], chartId: string) => {
        const strokeColor = "#1642c7";

        return (
            <section className={styles.graph}>
                <div className={styles.chartHeader}>
                    <h2>{title}</h2>
                    <span className={styles.trendUp}>
                        Analysis pending
                    </span>
                </div>
                <div className={styles.info2}>
                    <div className={styles.chartShell}>
                        <ResponsiveContainer width="100%" height={270}>
                            <BarChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#1642c7" stopOpacity={0.5} />
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
                                <Bar
                                    dataKey="value"
                                    fill={`url(#${chartId})`}
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        );
    };

    const renderPieChart = (title: string, pieData: { name: string; value: number }[]) => (
        <div className={styles.pieCard}>
            <h3>{title}</h3>
            <div className={styles.pieShell}>
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={1}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${title}-${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
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
    );

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
                    <p>Analysis will be available soon</p>
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
                            
                            <p>0</p>
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
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>User API Usage</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <path d="M10 6h4M17 10v4M10 18h4M6 10v4" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>Chatbot API Usage</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="9" cy="11" r="2" fill="currentColor"/>
                                <circle cx="15" cy="11" r="2" fill="currentColor"/>
                                <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>BUSINESS ACCOUNT</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12h4v2h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>BUSINESS ACCOUNT (PENDING PAYOUT)</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M3 10h18M7 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="18" cy="18" r="3" fill="var(--background_linear_1)" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M18 16.5v1.7l1.1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>SCHOOL ACCOUNT</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m3 10 9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M7 12.2V16c2.8 2 7.2 2 10 0v-3.8M21 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                    <div>
                        <h3>SCHOOL ACCOUNT (PENDING APPROVAL)</h3>
                        
                        <span className={styles.icons}>
                            <span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m3 9 9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M7 11.2V14c1.2.9 2.9 1.4 5 1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="18" cy="17" r="4" fill="var(--background_linear_1)" stroke="currentColor" strokeWidth="2"/>
                                    <path d="m16.3 17 1.1 1.1 2.3-2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            
                            <p>0</p>
                        </span>
                    </div>
                </div>
                <section className={styles.analytics_data}>
                    <div className={styles.graph_container}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 className={styles.reportTitle}>Reports</h3>
                            <select
                                value={chartRange}
                                onChange={(event) => setChartRange(event.target.value as ChartRange)}
                                aria-label="Report range"
                            >
                                <option value="week">Week</option>
                                <option value="year">Year</option>
                            </select>
                        </div>

                        {renderHistogram("Registered Accounts", emptyChartData, "activeAccountsHistogram")}
                        {renderHistogram("Number of PDF", emptyChartData, "pdfHistogram")}
                        {renderHistogram("AI API Usage", emptyChartData, "apiHistogram")}
                    </div>
                    <div className={styles.records}>
                        <h3 className={styles.reportTitle}>Overall Usage</h3>
                        {renderPieChart("Department Breakdown", departmentPieData)}
                        {renderPieChart("Student and Teacher Breakdown", accountTypePieData)}
                        {renderPieChart("Business Account Breakdown", businessAccountPieData)}
                        <h3 className={styles.reportTitle}>Most Top 20 users by Laco AI usage</h3>
                        <div className={styles.tableScroll}>
                            <table className={styles.rankings}>
                                <thead>
                                    <tr>
                                        <th>Top</th>
                                        <th>Email</th>
                                        <th>API Usage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={3}>Analysis pending</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                
            </section>
           
            
        </section>
    );

}
