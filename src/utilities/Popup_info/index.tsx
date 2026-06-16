"use client";
import styles from "./css/styles.module.css";

type HeaderProps = {
    status: string;
    bg_color: string;
    states: boolean;
    load: boolean;
    error: boolean;
}

export default function Popup_info({ status, bg_color, states, load, error } : HeaderProps) {

    return (
        <div className={styles.container} style={{ display: load ? "flex" : "none", background: bg_color }} role="status" aria-live="polite">
            <p>{status}</p>
            {states ? (
                <span className={styles.spinner} aria-hidden="true"></span>
            ) : (
                error ? (
                    <svg
                        className={styles.errorIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.35" />
                        <path
                            d="M8 8L16 16M16 8L8 16"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    <svg
                        className={styles.checkIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.35" />
                        <path
                            d="M7 12.5L10.5 16L17 9.5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            )}
        </div>
    );
}