import styles from "./css/styles.module.css";
import { useEffect, useRef, useState } from "react";
import { SweetAlert2, Fetch_toFile, Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface PdfFile {
    id?: number;
    file_name?: string;
    file?: string;
    summary?: string;
}

export default function Chat_bot() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<PdfFile[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    useEffect(() => {
        const retrieve_pdf = async () => {
            const response = await Fetch_to(api_link.storage.retrieve_chatbot , { email: "admin@admin.com" });
            if (response.success) {
                console.log(response.data.message);
                setData(response.data.message);
            }
            setRefresh(false);
        };
        retrieve_pdf();
    }, [refresh]);

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const status = "NoSpeak";

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", file);

        const response = await Fetch_toFile(api_link.storage.uploadpdf_chatbot , file, { email: "admin@admin.com" });
        Swal.close();

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            setRefresh(!refresh);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }

    };


    return(
        <section className={`${styles.container}`}>
            <header className={styles.header_cons}>
                <span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="5" width="12" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="10" cy="11" r="1" fill="currentColor"/>
                    <circle cx="14" cy="11" r="1" fill="currentColor"/>
                    <path d="M12 2v3M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h1>Chat Bot</h1>
                </span>

            </header>
            <section className={styles.search}>
                <input 
                type="text"
                name="search"
                id="search"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                />
                <button disabled={refresh} style={{ color: refresh ? 'var(--default-color-gray)' : '' }} onClick={() => {setRefresh(!refresh);}}>Refresh</button>
            </section>
            <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={HandleFile}
            />
            <section className={styles.status}>
                <span>
                    <h2>Your Documents</h2>
                    <button onClick={UploadPdf}>Upload PDF File</button>
                </span>
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Summary</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map((pdf, index) => (
                                    <tr key={index}>
                                        <td> {pdf.file_name} </td>
                                        <td> {pdf.summary} </td>
                                        <td>
                                            <button onClick={ async () => {
                                                SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
                                                const response = await Fetch_to(api_link.storage.deletepdf, { id: pdf.id, filePath: pdf.file });
                                                Swal.close();
                                                if (response) {
                                                    setRefresh(!refresh);
                                                } else {
                                                    SweetAlert2("Error", `${response}`, "error", true, "Confirm", false, "", false);
                                                }
                                            }}>Download</button>
                                            <button style={{ backgroundColor: "var(--default-color-red)" }} onClick={ async () => {
                                                SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
                                                const response = await Fetch_to(api_link.storage.deletepdf, { id: pdf.id, filePath: pdf.file });
                                                Swal.close();
                                                if (response) {
                                                    setRefresh(!refresh);
                                                } else {
                                                    SweetAlert2("Error", `${response}`, "error", true, "Confirm", false, "", false);
                                                }
                                            }}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                        No PDF Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );

}