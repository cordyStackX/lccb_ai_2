"use client";

import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import styles from "./PdfViewer.module.css";

type PdfViewerProps = {
    filePath: string;
    fileName: string;
    onClose: () => void;
};

export default function PdfViewer({ filePath, fileName, onClose }: PdfViewerProps) {
    const [pdfUrl, setPdfUrl] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        let blobUrl = "";

        setPdfUrl("");
        setError("");

        void (async () => {
            try {
                // Fetch through our authenticated same-origin route. The server reads
                // the private bucket, avoiding browser CORS and iframe restrictions.
                const pdfResponse = await fetch(
                    `${api_link.storage.downloadpdf_chatbot}?filePath=${encodeURIComponent(filePath)}`,
                    { credentials: "same-origin" },
                );
                if (!pdfResponse.ok) {
                    const body = await pdfResponse.json().catch(() => null);
                    throw new Error(body?.error || `Could not load PDF (${pdfResponse.status}).`);
                }

                const blob = await pdfResponse.blob();
                blobUrl = URL.createObjectURL(blob);
                if (active) setPdfUrl(blobUrl);
            } catch (cause) {
                if (active) setError(cause instanceof Error ? cause.message : "Could not load this PDF.");
            }
        })();

        return () => {
            active = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [filePath]);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div
            role="presentation"
            onClick={onClose}
            className={styles.overlay}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={`PDF viewer: ${fileName}`}
                onClick={(event) => event.stopPropagation()}
                className={styles.dialog}
            >
                <header className={styles.header}>
                    <strong className={styles.fileName}>{fileName}</strong>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close PDF viewer"
                        title="Close preview"
                        className={styles.closeButton}
                    >
                        ×
                    </button>
                </header>
                {error ? (
                    <p role="alert" className={styles.message}>{error}</p>
                ) : pdfUrl ? (
                    <iframe title={`PDF pages: ${fileName}`} src={pdfUrl} className={styles.frame} />
                ) : (
                    <p className={styles.message}>Loading PDF…</p>
                )}
            </section>
        </div>
    );
}
