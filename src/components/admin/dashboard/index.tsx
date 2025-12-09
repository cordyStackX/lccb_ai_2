"use client";
import styles from "./css/styles.module.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";


export default function Dashboard() {

    const data = [
        { name: "Sun", users: 12 },
        { name: "Mon", users: 12 },
        { name: "Tue", users: 19 },
        { name: "Wed", users: 12 },
        { name: "Thu", users: 19 },
        { name: "Fri", users: 12 },
        { name: "Sat", users: 19 },
    ];

    return(
        <section className={styles.container}>
            
            <section className={styles.status}>
                <h2>System Status Today</h2>
                <div className={`${styles.info} display_flex_center`}>
                    <div>
                        <h3>Active Accounts</h3>
                        <p>1</p>
                    </div>
                    <div>
                        <h3>Requested Active Code</h3>
                        <p>1</p>
                    </div>
                    <div>
                        <h3>AI API Requested</h3>
                        <p>2</p>
                    </div>
                </div>
            </section>
            <section className={styles.graph}>
                <h2>Active Accounts Weekly</h2>
                 <div className={`${styles.info2} display_flex_center`}>
                    <div>
                       <BarChart width={1200} height={450} data={data}>
                            <XAxis dataKey="name" stroke="#2f28beff"/>
                            <YAxis stroke="#2f28beff"/>
                            <Tooltip />
                            <Bar type="monotone" dataKey="users" fill="#2f28beff" />
                        </BarChart>
                    </div>
                </div>
            </section>
            <section className={styles.graph}>
                <h2>Requested Code Weekly</h2>
                 <div className={`${styles.info2} display_flex_center`}>
                    <div>
                       <BarChart width={1200} height={450} data={data}>
                            <XAxis dataKey="name" stroke="#2f28beff"/>
                            <YAxis stroke="#2f28beff"/>
                            <Tooltip />
                            <Bar type="monotone" dataKey="users" fill="#2f28beff" />
                        </BarChart>
                    </div>
                </div>
                
            </section>
            <section className={styles.graph}>
                <h2>AI API Requested Weekly</h2>
                 <div className={`${styles.info2} display_flex_center`}>
                    <div>
                       <BarChart width={1200} height={450} data={data}>
                            <XAxis dataKey="name" stroke="#2f28beff"/>
                            <YAxis stroke="#2f28beff"/>
                            <Tooltip />
                            <Bar type="monotone" dataKey="users" fill="#2f28beff" />
                        </BarChart>
                    </div>
                </div>
                
            </section>
        </section>
    );

}