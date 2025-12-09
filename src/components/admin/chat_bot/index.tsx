import styles from "./css/styles.module.css";
import { useRef } from "react";
import { SweetAlert2, Fetch_toFile } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import Swal from "sweetalert2";

export default function Chat_bot() {

    const fileRef = useRef<HTMLInputElement>(null);

    const UploadPdf = () => {
        fileRef.current?.click();
    };

    const HandleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }

        console.log("PDF selected:", file);

        const response = await Fetch_toFile(api_link.storage.uploadPdf, file, { email: "admin@admin.com" });
        Swal.close();

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
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
                <h2>File Uploaded</h2>
                <div>
                    <h2>Empty</h2>
                </div>
            </section>
        </section>
    );

}