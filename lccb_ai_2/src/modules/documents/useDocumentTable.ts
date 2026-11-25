import { useEffect, useRef, useState } from "react";
import { Fetch_to, Fetch_toFile } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

export interface DocFile {
    id?: number;
    file_name?: string;
    file?: string;
    summary?: string;
    suggest?: string;
}

export interface PrivacyWarning {
    fileName?: string;
    findings?: Array<{ category?: string; pages?: number[] }>;
}

interface DocumentTableEndpoints {
    retrieve: string;
    upload: string;
    download: string;
    delete: string;
    sensitive?: boolean;
}

interface NotifyHandlers {
    onStart?: (message: string) => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    onUploadStart?: (files: File[]) => void;
    onUploadTransferred?: () => void;
    onUploadSuccess?: (message?: string, details?: { uploaded?: Array<Record<string, unknown>>; privacyScan?: Array<Record<string, unknown>> }) => void;
    onUploadError?: (message: string, details?: { uploaded?: Array<Record<string, unknown>>; privacyScan?: Array<Record<string, unknown>> }) => void;
    onPrivacyReview?: (warnings: PrivacyWarning[]) => Promise<boolean>;
}

const PAGE_SIZE = 30;

export function useDocumentTable(
    endpoints: DocumentTableEndpoints,
    email: string,
    notify?: NotifyHandlers
) {
    const fileRef = useRef<HTMLInputElement>(null);
    const uploadController = useRef<AbortController | null>(null);
    const [data, setData] = useState<DocFile[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUploadedDoc, setLastUploadedDoc] = useState<DocFile | null>(null);

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

    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;

        const hasInvalid = files.some(
            (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
        );
        if (hasInvalid) {
            notify?.onError?.("Please select a PDF file.");
            if (fileRef.current) fileRef.current.value = "";
            return;
        }

        notify?.onUploadStart?.(files);

        const controller = new AbortController();
        uploadController.current = controller;
        let response = await Fetch_toFile(endpoints.upload, files, { email }, {}, 3, 1000, {
            signal: controller.signal,
            onUploadTransferred: notify?.onUploadTransferred,
        });
        if (controller.signal.aborted) {
            notify?.onUploadError?.("Upload cancellation requested. The server may finish processing files it already received.");
            setRefresh(true);
            uploadController.current = null;
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        let privacyScan: Array<Record<string, unknown>> = Array.isArray(response.data?.scanResults) ? response.data.scanResults : [];
        if (response.data?.requiresPrivacyConfirmation === true) {
            const warnings: PrivacyWarning[] = Array.isArray(response.data.warnings) ? response.data.warnings : [];
            privacyScan = Array.isArray(response.data.scanResults) ? response.data.scanResults : warnings.map((warning) => ({
                fileName: warning.fileName,
                findings: warning.findings,
                containsSensitiveInfo: true,
            }));
            const shouldContinue = await notify?.onPrivacyReview?.(warnings) ?? false;
            if (shouldContinue) {
                response = await Fetch_toFile(endpoints.upload, files, { email, privacyConfirmed: "true" }, {}, 3, 1000, {
                    signal: controller.signal,
                    onUploadTransferred: notify?.onUploadTransferred,
                });
                if (controller.signal.aborted) {
                    notify?.onUploadError?.("Upload cancellation requested. The server may finish processing files it already received.");
                    setRefresh(true);
                    uploadController.current = null;
                    if (fileRef.current) fileRef.current.value = "";
                    return;
                }
            } else {
                notify?.onUploadError?.("Upload cancelled after the privacy warning.");
                uploadController.current = null;
                if (fileRef.current) fileRef.current.value = "";
                return;
            }
        }

        if (response.success) {
            const uploaded = response.data?.uploaded;
            notify?.onUploadSuccess?.(typeof response.data?.message === "string" ? response.data.message : "Upload complete.", {
                uploaded: Array.isArray(uploaded) ? uploaded : [],
                privacyScan: Array.isArray(response.data?.scanResults) && response.data.scanResults.length ? response.data.scanResults : privacyScan,
            });
            if (Array.isArray(uploaded)) {
                const firstSuccessful = uploaded.find((item: unknown) => {
                    const document = item as { success?: unknown; id?: unknown };
                    return document.success === true && typeof document.id === "number";
                }) as { id: number; originalName?: string; filePath?: string; summary?: string; suggest?: string } | undefined;
                if (firstSuccessful) {
                    setLastUploadedDoc({
                        id: firstSuccessful.id,
                        file_name: firstSuccessful.originalName,
                        file: firstSuccessful.filePath,
                        summary: firstSuccessful.summary,
                        suggest: firstSuccessful.suggest,
                    });
                }
            }
            setRefresh(true);
        } else {
            notify?.onUploadError?.(response.message || "Upload failed", {
                uploaded: Array.isArray(response.data?.uploaded) ? response.data.uploaded : [],
                privacyScan: Array.isArray(response.data?.scanResults) && response.data.scanResults.length ? response.data.scanResults : privacyScan,
            });
        }

        if (fileRef.current) fileRef.current.value = "";
        uploadController.current = null;
    };

    const cancelUpload = () => {
        if (!uploadController.current) return false;
        uploadController.current.abort();
        return true;
    };

    const deleteIncompleteUploads = async (startedAt: string) => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
                const response = await fetch(api_link.storage.processing_status, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, started_at: startedAt, sensitive: endpoints.sensitive === true, include_completed: true }),
                });
                const result = await response.json();
                const pending = (result?.progress ?? []).filter((item: { id?: number; file?: string }) => Number.isInteger(item.id) && typeof item.file === "string");
                if (response.ok && pending.length) {
                    const deleted = await Promise.all(pending.map((item: { id: number; file: string }) =>
                        Fetch_to(endpoints.delete, { id: item.id, filePath: item.file })
                    ));
                    if (deleted.some((item) => item.success)) setRefresh(true);
                    if (deleted.every((item) => item.success)) return;
                }
            } catch {
                // Keep trying briefly while the canceled request finishes its current step.
            }
            await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleFiles(e.target.files ? Array.from(e.target.files) : []);
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

    // Deletes immediately — no undo window. Confirmation is expected upstream.
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
        cancelUpload,
        deleteIncompleteUploads,
        data,
        search,
        setSearch,
        page,
        setPage,
        totalPages,
        isLoading,
        lastUploadedDoc,
        refresh,
        setRefresh,
        triggerUpload,
        handleFile,
        handleFiles,
        downloadFile,
        deleteFile,
        deleteFiles,
        selectedIds,
        toggleSelect,
        toggleSelectAll,
        deleteSelected,
    };
}
