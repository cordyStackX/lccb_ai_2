"use client";
import styles from "./css/styles.module.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
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

interface PDF_record {
    created_at?: string;
}

interface API_logs {
    request?: string;
    created_at?: string;
}

export default function Dashboard() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [pdf_record, setPdf_record] = useState<PDF_record[]>([]);
    const [api_logs, setApi_logs] = useState<API_logs[]>([]);

    useEffect(() => {
        const RetrieveUserData = async () => {
            const response = await Fetch_to(api_link.admin.retrieve_user);
            const response2 = await Fetch_to(api_link.admin.retrieve_pdf_record);
            const response3 = await Fetch_to(api_link.admin.retrieve_API_logs);
            if (response.success) {
                setData(response.data.message);
                setPdf_record(response2.data.message);
                setApi_logs(response3.data.message);
            }
        };
        RetrieveUserData();
        
    }, []);


    function getDayOfWeek(dateString: string) {
        return new Date(dateString).getDay(); // 0 Sun, 1 Mon, ...
    }

    const weeklyUsers = [0,0,0,0,0,0,0];

    const weeklyPDF_record = [0,0,0,0,0,0,0];

    const weeklyAPI_logs = [0,0,0,0,0,0,0];

    data.forEach(user => {
        if (user.created_at) {
            const day = getDayOfWeek(user.created_at);
            weeklyUsers[day]++;
        }
    });

    pdf_record.forEach(pdf => {
        if (pdf.created_at) {
            const day = getDayOfWeek(pdf.created_at);
            weeklyPDF_record[day]++;
        }
    });
    
    api_logs.forEach(api => {
        if (api.created_at) {
            const day = getDayOfWeek(api.created_at);
            weeklyAPI_logs[day]++;
        }
    });

    const UserSet = [
        { name: "Sun", users: weeklyUsers[0] },
        { name: "Mon", users: weeklyUsers[1] },
        { name: "Tue", users: weeklyUsers[2] },
        { name: "Wed", users: weeklyUsers[3] },
        { name: "Thu", users: weeklyUsers[4] },
        { name: "Fri", users: weeklyUsers[5] },
        { name: "Sat", users: weeklyUsers[6] },
    ];

    const Pdf_set = [
        { name: "Sun", pdf: weeklyPDF_record[0] },
        { name: "Mon", pdf: weeklyPDF_record[1] },
        { name: "Tue", pdf: weeklyPDF_record[2] },
        { name: "Wed", pdf: weeklyPDF_record[3] },
        { name: "Thu", pdf: weeklyPDF_record[4] },
        { name: "Fri", pdf: weeklyPDF_record[5] },
        { name: "Sat", pdf: weeklyPDF_record[6] },
    ];

    const Api_logs = [
        { name: "Sun", api: weeklyAPI_logs[0] },
        { name: "Mon", api: weeklyAPI_logs[1] },
        { name: "Tue", api: weeklyAPI_logs[2] },
        { name: "Wed", api: weeklyAPI_logs[3] },
        { name: "Thu", api: weeklyAPI_logs[4] },
        { name: "Fri", api: weeklyAPI_logs[5] },
        { name: "Sat", api: weeklyAPI_logs[6] },
    ];

    return(
        <section className={styles.container}>
            
            <section className={styles.status}>
                <h2>System Status Today</h2>
                <div className={`${styles.info}`}>
                    <div>
                        <h3>Active Accounts</h3>
                        <p> {data.length} </p>
                    </div>
                    <div>
                        <h3>Number of Pdf uploaded</h3>
                        <p> {pdf_record.length} </p>
                    </div>
                    <div>
                        <h3>AI API Requested</h3>
                        <p> {api_logs.length} </p>
                    </div>
                </div>
            </section>
            <div className={styles.graph_container}>
                <section className={styles.graph}>
                    <h2>Active Accounts Weekly</h2>
                    <div className={`${styles.info2}`}>
                        <div>
                        <BarChart width={380} height={250} data={UserSet}>
                                <XAxis dataKey="name" stroke="#2f28beff"/>
                                <Tooltip />
                                <Bar type="monotone" dataKey="users" fill="#2f28beff" />
                            </BarChart>
                        </div>
                    </div>
                </section>
                <section className={styles.graph}>
                    <h2>Number of PDF Weekly</h2>
                    <div className={`${styles.info2}`}>
                        <div>
                        <BarChart width={380} height={250} data={Pdf_set}>
                                <XAxis dataKey="name" stroke="#2f28beff"/>
                                <Tooltip />
                                <Bar type="monotone" dataKey="pdf" fill="#2f28beff" />
                            </BarChart>
                        </div>
                    </div>
                    
                </section>
                <section className={styles.graph}>
                    <h2>AI API Requested Weekly</h2>
                    <div className={`${styles.info2}`}>
                        <div>
                        <BarChart width={400} height={250} data={Api_logs}>
                                <XAxis dataKey="name" stroke="#2f28beff"/>
                                <YAxis stroke="#2f28beff"/>
                                <Tooltip />
                                <Bar type="monotone" dataKey="api" fill="#2f28beff" />
                            </BarChart>
                        </div>
                    </div>
                    
                </section>
            </div>
            
        </section>
    );

}