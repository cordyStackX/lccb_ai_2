"use client";

import { useId } from "react";
import Link from "next/link";

type UploadDisclaimerProps = {
    sensitive: boolean;
    accepted: boolean;
    onAcceptedChange: (accepted: boolean) => void;
};

export default function UploadDisclaimer({ sensitive, accepted, onAcceptedChange }: UploadDisclaimerProps) {
    const checkboxId = useId();

    return (
        <div style={{ margin: "0 1.5rem 1rem", padding: "0.85rem 1rem", border: "1px solid #cbd1db", borderRadius: 10, background: "rgba(255,255,255,.45)" }}>
            <label htmlFor={checkboxId} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: ".86rem", fontWeight: 700, lineHeight: 1.45 }}>
                <input
                    id={checkboxId}
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => onAcceptedChange(event.target.checked)}
                    style={{ width: 18, height: 18, flex: "0 0 18px", margin: "1px 0 0", accentColor: "var(--primary)" }}
                />
                <span>I have read and accept this upload disclaimer.</span>
            </label>
            <p style={{ margin: ".55rem 0 .45rem 28px", color: "#5f6b7b", fontSize: ".8rem", lineHeight: 1.5 }}>
                {sensitive
                    ? "I confirm I am authorized to upload these student records. OpenAI scans PDF pages for possible personal or credential information before restricted record extraction; these files are not used for general chatbot answers."
                    : "I confirm I have permission to upload this PDF. OpenAI scans pages for possible personal or credential information before upload. Public Documents may be used by the chatbot to answer questions, so do not upload sensitive, confidential, or password-protected information here."}
            </p>
            <p style={{ margin: "0 0 0 28px", color: "#5f6b7b", fontSize: ".78rem" }}>
                Review the <Link href="/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>Privacy Policy</Link>
                {" and "}
                <Link href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>Terms and Conditions</Link>.
            </p>
        </div>
    );
}
