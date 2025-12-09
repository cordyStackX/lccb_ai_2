import styles from "./css/styles.module.css";
import { useEffect, useRef, useState } from "react";
import { SweetAlert2, Fetch_toFile, Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

interface PdfFile {
    id?: number;
    file_name?: string;
    status?: string;
    file?: string;
}

export default function Chat_bot() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<PdfFile[]>([]);
    const [refresh, setRefresh] = useState("");

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    useEffect(() => {
        const retrieve_pdf = async () => {
            const response = await Fetch_to(api_link.storage.retrieve, { email: "admin@admin.com" });
            if (response.success) {
                console.log(response.data.message);
                setData(response.data.message);
            }
        };
        retrieve_pdf();
    }, [refresh]);

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const refresh = Math.floor(10 + Math.random() * 90).toString();
        const file = e.target.files?.[0];
        if (!file) return;
        const status = "NoSpeak";

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", file);

        const response = await Fetch_toFile(api_link.storage.uploadPdf, file, { email: "admin@admin.com", status: status });
        Swal.close();

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            setRefresh(refresh);
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
        <section className={`${styles.container} display_flex_center`}>
            <section className={`${styles.uploader} display_flex_center`}>
                <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={HandleFile}
                />
                <button onClick={UploadPdf}>Upload PDF File</button>
            </section>
            <section className={styles.status}>
                <h2>Your Documents</h2>
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map((pdf, index) => (
                                    <tr key={index}>
                                        <td> {pdf.file_name} {pdf.status === "Speak" ? "✅️" : ""} </td>
                                        <td>
                                            <select
                                            value={pdf.status} // <-- set current status as selected
                                            onChange={ async(e) => {
                                                const newStatus = e.target.value;
                                                if (newStatus === "Delete") {
                                                    const refresh = Math.floor(10 + Math.random() * 90).toString();
                                                    SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
                                                    const response = await Fetch_to(api_link.storage.deletepdf, { id: pdf.id, filePath: pdf.file });
                                                    Swal.close();
                                                    if (response) {
                                                        setRefresh(`${refresh}`);
                                                    } else {
                                                        SweetAlert2("Error", `${response}`, "error", true, "Confirm", false, "", false);
                                                    }
                                                } else {
                                                    const refresh = Math.floor(10 + Math.random() * 90).toString();
                                                    SweetAlert2("Updating", "Please wait..", "info", false, "", false, "", true);
                                                    const response = await Fetch_to(api_link.storage.updatepdf, { id: pdf.id, status: newStatus, email: "admin@admin.com" });
                                                    Swal.close();
                                                    if (response.success) {
                                                        setRefresh(`${refresh}`);
                                                    } else {
                                                        SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
                                                    }
                                                }
                                            }}
                                            >
                                                <option value="NoSpeak">NoSpeak</option>
                                                <option value="Speak">Speak</option>
                                                <option value="Delete">Delete</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );

}