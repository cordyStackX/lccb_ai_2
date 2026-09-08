"use client";
import { Fetch_to, Progress } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const Under_Development = () => {
    const router = useRouter();

    useEffect(() => {
        Progress(false);
    }, []);

    return (
        <section
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexFlow: "column",
                gap: "1.25rem",
                background: "#0f172a",
                color: "#e2e8f0",
                textAlign: "center",
                padding: "2rem",
            }}
        >
            <svg
                width="180"
                height="180"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="100" cy="100" r="90" fill="#1e293b" />
                <circle cx="100" cy="100" r="90" stroke="#38bdf8" strokeWidth="3" strokeDasharray="8 6" />
                <rect x="55" y="90" width="90" height="55" rx="6" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
                <rect x="65" y="100" width="70" height="8" rx="2" fill="#38bdf8" opacity="0.6" />
                <rect x="65" y="115" width="45" height="8" rx="2" fill="#38bdf8" opacity="0.4" />
                <path d="M85 90V75a15 15 0 0130 0v15" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="55" r="10" fill="#facc15" />
                <path
                    d="M40 60 L48 52 M160 60 L152 52 M40 140 L48 148 M160 140 L152 148"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>

            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "0.02em" }}>
                <span style={{ color: "#38bdf8" }}>{"<"}</span>{" "}
                Under Development{" "}
                <span style={{ color: "#38bdf8" }}>{">"}</span>
            </h1>
            <p style={{ color: "#94a3b8", maxWidth: "28rem", fontSize: "0.95rem" }}>
                This part of the system is still being built. Check back soon or track progress on GitHub.
            </p>

            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <a
                    href="https://github.com/cordyStackX/lccb_ai_2/issues"
                    style={{
                        color: "#4ade80",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "none",
                    }}
                >
                    Check the GitHub Repo
                </a>
                <a
                    onClick={async () => {
                        await Fetch_to(api_link.jwt.deauth);
                        router.push("/");
                    }}
                    style={{
                        color: "#f87171",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Go Back Home
                </a>
            </div>
        </section>
    );
};