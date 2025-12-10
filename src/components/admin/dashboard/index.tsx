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

interface Code_Logs {
    code?: string;
    created_at?: string;
}

interface API_logs {
    request?: string;
    created_at?: string;
}

export default function Dashboard() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [code_logs, setCode_logs] = useState<Code_Logs[]>([]);
    const [api_logs, setApi_logs] = useState<API_logs[]>([]);

    useEffect(() => {
        const RetrieveUserData = async () => {
            const response = await Fetch_to(api_link.admin.retrieve_user);
            const response2 = await Fetch_to(api_link.admin.retrieve_code_logs);
            const response3 = await Fetch_to(api_link.admin.retrieve_API_logs);
            if (response.success) {
                setData(response.data.message);
                setCode_logs(response2.data.message);
                setApi_logs(response3.data.message);
            }
        };
        RetrieveUserData();
        
    }, [data]);


    function getDayOfWeek(dateString: string) {
        return new Date(dateString).getDay(); // 0 Sun, 1 Mon, ...
    }

    const weeklyUsers = [0,0,0,0,0,0,0];

    const weeklyCode_logs = [0,0,0,0,0,0,0];

    const weeklyAPI_logs = [0,0,0,0,0,0,0];

    data.forEach(user => {
        if (user.created_at) {
            const day = getDayOfWeek(user.created_at);
            weeklyUsers[day]++;
        }
    });

    code_logs.forEach(code => {
        if (code.created_at) {
            const day = getDayOfWeek(code.created_at);
            weeklyCode_logs[day]++;
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

    const Code_logs = [
        { name: "Sun", code: weeklyCode_logs[0] },
        { name: "Mon", code: weeklyCode_logs[1] },
        { name: "Tue", code: weeklyCode_logs[2] },
        { name: "Wed", code: weeklyCode_logs[3] },
        { name: "Thu", code: weeklyCode_logs[4] },
        { name: "Fri", code: weeklyCode_logs[5] },
        { name: "Sat", code: weeklyCode_logs[6] },
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
                <div className={`${styles.info} display_flex_center`}>
                    <div>
                        <h3>Active Accounts</h3>
                        <p> {data.length} </p>
                    </div>
                    <div>
                        <h3>Requested Active Code</h3>
                        <p> {code_logs.length} </p>
                    </div>
                    <div>
                        <h3>AI API Requested</h3>
                        <p> {api_logs.length} </p>
                    </div>
                </div>
            </section>
            <section className={styles.graph}>
                <h2>Active Accounts Weekly</h2>
                 <div className={`${styles.info2} display_flex_center`}>
                    <div>
                       <BarChart width={1200} height={450} data={UserSet}>
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
                       <BarChart width={1200} height={450} data={Code_logs}>
                            <XAxis dataKey="name" stroke="#2f28beff"/>
                            <YAxis stroke="#2f28beff"/>
                            <Tooltip />
                            <Bar type="monotone" dataKey="code" fill="#2f28beff" />
                        </BarChart>
                    </div>
                </div>
                
            </section>
            <section className={styles.graph}>
                <h2>AI API Requested Weekly</h2>
                 <div className={`${styles.info2} display_flex_center`}>
                    <div>
                       <BarChart width={1200} height={450} data={Api_logs}>
                            <XAxis dataKey="name" stroke="#2f28beff"/>
                            <YAxis stroke="#2f28beff"/>
                            <Tooltip />
                            <Bar type="monotone" dataKey="api" fill="#2f28beff" />
                        </BarChart>
                    </div>
                </div>
                
            </section>
        </section>
    );

}