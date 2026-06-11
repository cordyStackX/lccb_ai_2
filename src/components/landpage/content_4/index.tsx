"use client";
import { useMemo, useState } from "react";
import styles from "./css/styles.module.css";

const faqs = [
    {
        question: "What is the primary objective of the LACO AI study?",
        answer:
            "The primary objective is to design and develop LACO AI, an AI-powered platform that supports student learning through document analysis and summarization while ensuring security and production readiness.",
    },
    {
        question: "What functionalities will LACO AI provide?",
        answer:
            "LACO AI aims to summarize, explain, and analyze PDF documents to enhance academic comprehension. It will also integrate the OpenAI API to generate accurate and contextual responses based on uploaded learning materials.",
    },
    {
        question: "How will user security be ensured in LACO AI?",
        answer:
            "The platform will implement secure user authentication with email verification, middleware-based security, and role-based access control for administrators and students.",
    },
    {
        question: "What features will be included in the platform?",
        answer:
            "Key features include user sign-in and sign-up, email verification and code generation, AI-powered PDF upload, analysis, and summarization, plus role-based access control.",
    },
    {
        question: "Are there any limitations to the study?",
        answer:
            "Yes. Current limitations include dependency on the OpenAI API's availability, basic usage limitation mechanisms, and the exclusion of advanced analytics and billing systems in the current version.",
    },
    {
        question: "What types of testing will be conducted on LACO AI?",
        answer:
            "The testing plan includes functionality testing to ensure the system works according to its design and acceptance testing with users to gather feedback on usability and effectiveness.",
    },
    {
        question: "How will user roles be managed in LACO AI?",
        answer:
            "Users will have designated roles, such as students and administrators, with specific permissions. The system will also require teacher supervision for users under 13 and parental consent when applicable.",
    },
    {
        question: "What is the significance of this study?",
        answer:
            "The study is significant because it seeks to enhance student learning through advanced AI technology, providing efficient tools for document analysis while ensuring a secure learning environment.",
    },
    {
        question: "What technologies are being utilized in the development of LACO AI?",
        answer:
            "LACO AI will utilize modern technologies, including the OpenAI API for generating responses, advanced CSS for user interface design, and middleware-based security to ensure a secure and efficient platform.",
    },
    {
        question: "How will feedback from users be incorporated?",
        answer:
            "Feedback will be collected during acceptance testing, where students and teachers will use the system. Their input will be analyzed to refine and improve the platform before its full deployment.",
    },
    {
        question: "What are the expected outcomes of the LACO AI study?",
        answer:
            "The expected outcomes include a fully functional AI-powered platform that enhances students' understanding of academic materials, provides secure user access, and is prepared for beta testing and production deployment.",
    },
    {
        question: "Will LACO AI be accessible on multiple devices?",
        answer:
            "Yes, the platform is designed to be accessible on various devices, ensuring that students can utilize its features whether they are on a computer or a mobile device.",
    },
    {
        question: "How will the platform handle data privacy, especially for younger users?",
        answer:
            "LACO AI will implement strict privacy policies, including teacher supervision for users under 13 and parental consent requirements, to protect the privacy and safety of younger users.",
    },
    {
        question: "What is the timeline for the development and deployment of LACO AI?",
        answer:
            "The Gantt chart outlines the project timeline, including activities from planning and document revision to UI enhancements and finalization, indicating a structured approach to development.",
    },
    {
        question: "Can educators use LACO AI for teaching purposes?",
        answer:
            "Yes, educators can leverage LACO AI as a teaching tool to assist students in understanding complex documents and concepts, facilitating a more interactive learning experience.",
    },
    {
        question: "Will there be ongoing support and updates for LACO AI after deployment?",
        answer:
            "Post-deployment, the team plans to provide ongoing support and updates to address any issues, enhance functionalities, and incorporate user feedback for continuous improvement.",
    },
];

export default function Content_4() {
    const [query, setQuery] = useState("");
    const [showMore, setShowMore] = useState(false);

    const filteredFaqs = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return faqs;

        return faqs.filter((faq) => {
            return (
                faq.question.toLowerCase().includes(value) ||
                faq.answer.toLowerCase().includes(value)
            );
        });
    }, [query]);

    const visibleFaqs = showMore ? filteredFaqs : filteredFaqs.slice(0, 5);
    const hasMoreFaqs = filteredFaqs.length > 5;

    return(
        <section className={styles.container} id="FaQ">
            <div className={styles.wrapper}>
                <span className={styles.navi}><h3>FAQ</h3></span>
                <div className={styles.title}>
                    <h2>Frequently Asked Questions</h2>
                </div>
                <div className={styles.searchBox}>
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search FAQ..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className={styles.flexing}>
                    {visibleFaqs.length > 0 ? (
                        visibleFaqs.map((faq, index) => (
                        <details key={faq.question} className={styles.card} open={index === 0 && !showMore}>
                            <summary className={styles.question}>
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <h3>{faq.question}</h3>
                            </summary>
                            <p className={styles.answer}>{faq.answer}</p>
                        </details>
                        ))
                    ) : (
                        <div className={styles.noResults}>
                            No FAQ matches your search.
                        </div>
                    )}
                </div>
                {hasMoreFaqs && (
                    <button
                        type="button"
                        className={styles.showMore}
                        onClick={() => setShowMore((value) => !value)}
                    >
                        {showMore ? "Show less" : "Show more"}
                    </button>
                )}
                <span className={styles.para}>
                    <p>
                        This FAQ can help clarify key aspects of the study for stakeholders and users interested in LACO AI.
                    </p>
                </span>
                <div className={styles.fx_effects}></div>
            </div>
        </section>
    );

}
