"use client";
import styles from "./css/styles.module.css";
import { Fetch_to, SweetAlert2 } from "@/utilities";
import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface ManageUserDataProps {
    created_at?: string;
    email?: string;
    f_name?: string;
    id?: number;
    status?: string;
    year?: string;
    role?: string
}

interface ApiLogs {
    request?: string
}

export default function ManageUser() {
    const [data, setData] = useState<ManageUserDataProps[]>([]);
    const [refresh, setRefresh] = useState("");
    const [search, setSearch] = useState("");
    const [apiLogs, setApiLogs] = useState<ApiLogs[]>([]);

    useEffect(() => {
        const RetrieveUserData = async () => {
            const response = await Fetch_to(api_link.admin.retrieve_user);
            if (response.success) {
                setData(response.data.message);
            }
        };
        RetrieveUserData();
         const RetrieveUserDataLogs = async () => {
            const response = await Fetch_to(api_link.admin.system_logs);
            if (response.success) {
                setApiLogs(response.data.message);
            }
        };
        RetrieveUserDataLogs();
    }, [refresh]);

    const filtered = data.filter((item) => {
    const term = search.toLowerCase();

    return (
        item.f_name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.year?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term)
        );
    });

    const getApiCount = (email?: string) => {
        if (!email) return 0;
        return apiLogs.filter((log) => log.request === email).length;
    };


    return(
        <section className={styles.container}>
           <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 20c0-4 4-6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M14 14l6-6 2 2-6 6-3 1 1-3z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h1>Manage User</h1>
                </span>
            </header>
            <section className={styles.search}>
                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" stroke-linecap="round"/>
                </svg> */}
                <input 
                type="text"
                name="search"
                id="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={() => {setRefresh(`${!refresh}`);}}>Refresh</button>
            </section>
            <table className={styles.tables}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Gmail</th>
                        <th>Role</th>
                        <th>Created_at</th>
                        <th>API Request</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered && filtered.length > 0 ? (
                        filtered.map((data, index) => (
                            <tr key={index}>
                                <td> {data.f_name} </td>
                                <td> {data.year} </td>
                                <td> {data.email} </td>
                                <td> {data.role} </td>
                                <td> {data.created_at ? new Date(data.created_at).toLocaleDateString("en-US") : " - "} </td>
                                <td>{getApiCount(data.email)}</td>
                                <td>
                                    <select 
                                    value={data.status}
                                    onChange={ async(e) => {
                                        const newStatus = e.target.value;
                                        if (newStatus === "delete") {
                                            const refresh = Math.floor(10 + Math.random() * 90).toString();
                                            const alert2 = await SweetAlert2("Delete?", `Are you sure want to delete this ${data.email}`, "warning", true, "Yes", true, "No");
                                            if (!alert2.isConfirmed) return;
                                            SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
                                            const response = await Fetch_to(api_link.admin.delete_user, { email: data.email });
                                            Swal.close();
                                            if (response) {
                                                setRefresh(`${refresh}`);
                                            } else {
                                                SweetAlert2("Error", `${response}`, "error", true, "Confirm", false, "", false);
                                            }
                                        } else {
                                            const refresh = Math.floor(10 + Math.random() * 90).toString();
                                            SweetAlert2("Updating", "Please wait..", "info", false, "", false, "", true);
                                            const response = await Fetch_to(api_link.admin.update_user_status, { id: data.id, status: newStatus });
                                            Swal.close();
                                            if (response.success) {
                                                setRefresh(`${refresh}`);
                                            } else {
                                                SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
                                            }
                                        }
                                    }}
                                    >
                                        <option value="active">🟢 Active</option>
                                        <option value="suspend">🟡 Suspend</option>
                                        <option value="delete">🔴 Delete</option>
                                    </select>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                No User Found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );

}

