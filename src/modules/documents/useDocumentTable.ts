import { useEffect, useRef, useState } from "react";
import { Fetch_to, Fetch_toFile } from "@/utilities";

export interface DocFile {
    id?: number;
    file_name?: string;
    file?: string;
    summary?: string;
    suggest?: string;
}

interface DocumentTableEndpoints {
    retrieve: string;
    upload: string;
    download: string;
    delete: string;
}

interface NotifyHandlers {
    onStart?: (message: string) => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const PAGE_SIZE = 30;

export function useDocumentTable(
    endpoints: DocumentTableEndpoints,
    email: string,
    notify?: NotifyHandlers
) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<DocFile[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // ids currently selected via checkboxes for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!email) return;

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
            } else {
                notify?.onError?.(response.message || "Failed to load documents");
            }
            setIsLoading(false);
            setRefresh(false);
        };
        retrieveDocs();

    }, [refresh, page, search, endpoints.retrieve, email]);

    const triggerUpload = () => fileRef.current?.click();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        const hasInvalid = files.some(
            (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
        );
        if (hasInvalid) {
            notify?.onError?.("Please select a PDF file.");
            if (fileRef.current) fileRef.current.value = "";
            return;
        }

        notify?.onStart?.("Summarizing, please wait...");

        const response = await Fetch_toFile(endpoints.upload, files, { email });

        if (response.success) {
            notify?.onSuccess?.("Successfully uploaded");
            setRefresh(true);
        } else {
            notify?.onError?.(response.message || "Upload failed");
        }

        if (fileRef.current) fileRef.current.value = "";
    };

    const downloadFile = async (doc: DocFile) => {
        if (!doc.file) return;
        notify?.onStart?.("Downloading, please wait...");
        const response = await Fetch_to(endpoints.download, { filePath: doc.file });

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
                notify?.onSuccess?.("Download complete");
                return;
            } catch (error) {
                notify?.onError?.(`${error}`);
                return;
            }
        }
        notify?.onError?.(response.message || "Download failed");
    };

    // Deletes immediately — no undo window. Confirmation is expected to happen
    // upstream (e.g. a SweetAlert2 confirm) before this is called.
    const deleteFiles = async (docs: DocFile[]) => {
        const validDocs = docs.filter((d): d is DocFile & { id: number } => d.id !== undefined);
        if (validDocs.length === 0) return;

        notify?.onStart?.(validDocs.length > 1 ? "Deleting files, please wait..." : "Deleting file, please wait...");

        const results = await Promise.all(
            validDocs.map((doc) => Fetch_to(endpoints.delete, { id: doc.id, filePath: doc.file }))
        );
        const failed = results.filter((r) => !r.success);

        setSelectedIds((prev) => {
            const next = new Set(prev);
            validDocs.forEach((doc) => next.delete(doc.id));
            return next;
        });

        if (failed.length > 0) {
            notify?.onError?.(`${failed.length} file(s) failed to delete`);
        } else {
            notify?.onSuccess?.(validDocs.length > 1 ? "Files deleted" : "File deleted");
        }

        setRefresh(true);
    };

    // single-file convenience wrapper (keeps old call sites working)
    const deleteFile = (doc: DocFile) => deleteFiles([doc]);

    const toggleSelect = (id?: number) => {
        if (id === undefined) return;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (visibleIds: number[]) => {
        setSelectedIds((prev) => {
            const allSelected = visibleIds.every((id) => prev.has(id));
            if (allSelected) {
                const next = new Set(prev);
                visibleIds.forEach((id) => next.delete(id));
                return next;
            }
            return new Set([...prev, ...visibleIds]);
        });
    };

    const deleteSelected = () => {
        const docsToDelete = data.filter((doc) => doc.id !== undefined && selectedIds.has(doc.id));
        deleteFiles(docsToDelete);
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
        deleteFiles,
        selectedIds,
        toggleSelect,
        toggleSelectAll,
        deleteSelected,
    };
}