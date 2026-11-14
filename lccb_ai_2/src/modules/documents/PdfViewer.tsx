"use client";

import { useEffect, useState } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";

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

    return (
        <div
            role="presentation"
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.6)" }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={`PDF viewer: ${fileName}`}
                onClick={(event) => event.stopPropagation()}
                style={{ display: "flex", flexDirection: "column", width: "min(1100px, 96vw)", height: "90vh", background: "#fff", borderRadius: 8, overflow: "hidden" }}
            >
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                    <strong>{fileName}</strong>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close PDF viewer"
                        title="Close preview"
                        style={{
                            display: "grid",
                            placeItems: "center",
                            width: 36,
                            height: 36,
                            flex: "0 0 36px",
                            padding: 0,
                            border: "1px solid #e2e5eb",
                            borderRadius: "50%",
                            background: "#f5f6f8",
                            color: "#4b5563",
                            fontSize: 24,
                            fontWeight: 400,
                            lineHeight: 1,
                            cursor: "pointer",
                            transition: "background 140ms ease, color 140ms ease, border-color 140ms ease, transform 140ms ease",
                        }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background = "#fee2e2";
                            event.currentTarget.style.color = "#b91c1c";
                            event.currentTarget.style.borderColor = "#fecaca";
                            event.currentTarget.style.transform = "rotate(90deg)";
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background = "#f5f6f8";
                            event.currentTarget.style.color = "#4b5563";
                            event.currentTarget.style.borderColor = "#e2e5eb";
                            event.currentTarget.style.transform = "rotate(0deg)";
                        }}
                    >
                        ×
                    </button>
                </header>
                {error ? (
                    <p role="alert" style={{ padding: 16 }}>{error}</p>
                ) : pdfUrl ? (
                    <iframe title={`PDF pages: ${fileName}`} src={pdfUrl} style={{ flex: 1, width: "100%", border: 0 }} />
                ) : (
                    <p style={{ padding: 16 }}>Loading PDF…</p>
                )}
            </section>
        </div>
    );
}
