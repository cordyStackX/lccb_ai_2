import { useEffect, useRef, useState } from "react";
import { Fetch_to, Fetch_toFile, SweetAlert2 } from "@/utilities";
import Swal from "sweetalert2";

export interface DocFile {
    id?: number;
    file_name?: string;
    file?: string;
    summary?: string;
}

interface DocumentTableEndpoints {
    retrieve: string;
    upload: string;
    download: string;
    delete: string;
}

const PAGE_SIZE = 30;

export function useDocumentTable(endpoints: DocumentTableEndpoints, email = "admin@admin.com") {
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<DocFile[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const retrieveDocs = async () => {
            setIsLoading(true);
            const response = await Fetch_to(endpoints.retrieve, {
                email,
                page,
                limit: PAGE_SIZE,
                search,
            });
            if (response.success) {
                setData(response.data.message);
                setTotalPages(response.data.totalPages ?? 1);
            }
            setIsLoading(false);
            setRefresh(false);
        };
        retrieveDocs();
        
    }, [refresh, page, search, endpoints.retrieve]);

    const triggerUpload = () => fileRef.current?.click();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        const hasInvalid = files.some(
            (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
        );
        if (hasInvalid) {
            alert("Please select a PDF file.");
            return;
        }

        SweetAlert2("Uploading", "Please wait..", "info", false, "", false, "", true);

        const response = await Fetch_toFile(endpoints.upload, files, { email });
        Swal.close();

        if (response.success) {
            SweetAlert2("Success", "Successfully uploaded", "success", true, "Okay", false, "", false);
            setRefresh(true);
        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
        }

        if (fileRef.current) fileRef.current.value = "";
    };

    const downloadFile = async (doc: DocFile) => {
        if (!doc.file) return;
        SweetAlert2("Downloading", "Please wait..", "info", false, "", false, "", true);
        const response = await Fetch_to(endpoints.download, { filePath: doc.file });
        Swal.close();

        if (response.success && response.data?.url) {
            try {
                const fileResponse = await fetch(response.data.url as string, { method: "GET" });
                if (!fileResponse.ok) throw new Error("Failed to fetch file");

                const blob = await fileResponse.blob();
                const blobUrl = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = blobUrl;
                anchor.download = doc.file_name || "document.pdf";
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(blobUrl);
                return;
            } catch (error) {
                SweetAlert2("Error", `${error}`, "error", true, "Confirm", false, "", false);
                return;
            }
        }
        SweetAlert2("Error", `${response.message || "Download failed"}`, "error", true, "Confirm", false, "", false);
    };

    const deleteFile = async (doc: DocFile) => {
        SweetAlert2("Deleting", "Please wait..", "info", false, "", false, "", true);
        const response = await Fetch_to(endpoints.delete, { id: doc.id, filePath: doc.file });
        Swal.close();
        if (response.success) {
            setRefresh(true);
        } else {
            SweetAlert2("Error", `${response.message || "Delete failed"}`, "error", true, "Confirm", false, "", false);
        }
    };

    return {
        fileRef,
        data,
        search,
        setSearch,
        page,
        setPage,
        totalPages,
        isLoading,
        refresh,
        setRefresh,
        triggerUpload,
        handleFile,
        downloadFile,
        deleteFile,
    };
}