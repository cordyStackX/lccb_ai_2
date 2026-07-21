import { useEffect, useMemo, useRef, useState } from "react";
import { Fetch_to, Fetch_toFile } from "@/utilities";

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

interface NotifyHandlers {
    onStart?: (message: string) => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const PAGE_SIZE = 30;
const UNDO_DELAY_MS = 5000;

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

    // ids currently "pending delete" (hidden, countdown running)
    const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
    // ids currently selected via checkboxes for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const deleteTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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

    // clear any pending timers on unmount so we don't call setState after unmount
    useEffect(() => {
        return () => {
            deleteTimers.current.forEach((timer) => clearTimeout(timer));
            deleteTimers.current.clear();
        };
    }, []);

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

    // Actually calls the delete endpoint for a batch of docs (fires after the undo window expires)
    const commitDelete = async (docs: DocFile[]) => {
        const results = await Promise.all(
            docs.map((doc) => Fetch_to(endpoints.delete, { id: doc.id, filePath: doc.file }))
        );
        const failed = results.filter((r) => !r.success);

        setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            docs.forEach((doc) => { if (doc.id !== undefined) next.delete(doc.id); });
            return next;
        });

        if (failed.length > 0) {
            notify?.onError?.(`${failed.length} file(s) failed to delete`);
            setRefresh(true); // pull the real state back since some rows didn't actually delete
        } else {
            notify?.onSuccess?.(docs.length > 1 ? "Files deleted" : "File deleted");
            setRefresh(true);
        }
    };

    // Starts the undo countdown for one or more docs. Rows disappear immediately;
    // the real delete only happens if undoDelete() isn't called within UNDO_DELAY_MS.
    const deleteFiles = (docs: DocFile[]) => {
        const validDocs = docs.filter((d): d is DocFile & { id: number } => d.id !== undefined);
        if (validDocs.length === 0) return;

        setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            validDocs.forEach((doc) => next.add(doc.id));
            return next;
        });

        setSelectedIds((prev) => {
            const next = new Set(prev);
            validDocs.forEach((doc) => next.delete(doc.id));
            return next;
        });

        const timer = setTimeout(() => {
            validDocs.forEach((doc) => deleteTimers.current.delete(doc.id));
            commitDelete(validDocs);
        }, UNDO_DELAY_MS);

        // one shared timer id stored per doc so undo can cancel precisely
        validDocs.forEach((doc) => deleteTimers.current.set(doc.id, timer));
    };

    // single-file convenience wrapper (keeps old call sites working)
    const deleteFile = (doc: DocFile) => deleteFiles([doc]);

    const undoDelete = (ids: number[]) => {
        ids.forEach((id) => {
            const timer = deleteTimers.current.get(id);
            if (timer) {
                clearTimeout(timer);
                deleteTimers.current.delete(id);
            }
        });
        setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
        });
        notify?.onSuccess?.(ids.length > 1 ? "Deletion undone" : "Deletion undone");
    };

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

    // rows to actually render: exclude anything mid-undo-countdown
    const visibleData = useMemo(
        () => data.filter((doc) => doc.id === undefined || !pendingDeleteIds.has(doc.id)),
        [data, pendingDeleteIds]
    );

    return {
        fileRef,
        data: visibleData,
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
        undoDelete,
        pendingDeleteIds,
        selectedIds,
        toggleSelect,
        toggleSelectAll,
        deleteSelected,
    };
}