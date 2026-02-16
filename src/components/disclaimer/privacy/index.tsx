import styles from "./css/styles.module.css";

export default function Privacy() {

    return(
        <section className={styles.container}>
            <div className={styles.content}>
                <h1>Privacy Policy</h1>
                <p className={styles.updated}>Last Updated: December 13, 2025</p>

                <div className={styles.notice}>
                    <h2>⚠️ Important Notice</h2>
                    <p>This is a <strong>BETA VERSION</strong> educational project for research and experimental purposes only. This platform is not intended for production use or commercial purposes.</p>
                </div>

                <section className={styles.section}>
                    <h2>1. Introduction</h2>
                    <p>Welcome to LACO AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational AI research platform.</p>
                    <p>This project is developed under the Apache License 2.0 and is intended solely for educational, research, and experimental purposes. We are committed to protecting your privacy and handling your data responsibly.</p>
                </section>

                <section className={styles.section}>
                    <h2>2. Educational and Experimental Nature</h2>
                    <p>This platform is:</p>
                    <ul>
                        <li>A beta version for educational and research purposes</li>
                        <li>Not intended for commercial or production use</li>
                        <li>Provided &quot;as-is&quot; without any warranties</li>
                        <li>Subject to changes, updates, or discontinuation without notice</li>
                        <li>Not designed to handle sensitive, confidential, or personal data</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. Information We Collect</h2>
                    <h3>3.1 Account Information</h3>
                    <ul>
                        <li>Email address</li>
                        <li>First name</li>
                        <li>Password (encrypted)</li>
                        <li>Account creation date</li>
                        <li>Account status</li>
                    </ul>

                    <h3>3.2 Usage Data</h3>
                    <ul>
                        <li>API request logs</li>
                        <li>PDF file names and upload information</li>
                        <li>Chat prompts and AI-generated responses</li>
                        <li>Access logs and timestamps</li>
                    </ul>

                    <h3>3.3 Technical Data</h3>
                    <ul>
                        <li>IP address</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>Cookies and local storage data</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. How We Use Your Information</h2>
                    <p>We use collected information for:</p>
                    <ul>
                        <li>Providing and maintaining the service</li>
                        <li>User authentication and account management</li>
                        <li>Processing PDF documents and generating AI responses</li>
                        <li>Research and educational analysis</li>
                        <li>Improving platform functionality and user experience</li>
                        <li>Monitoring system performance and debugging</li>
                        <li>Preventing fraud and unauthorized access</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Data Storage and Security</h2>
                    <ul>
                        <li>User data is stored in Supabase (PostgreSQL database)</li>
                        <li>PDF files are temporarily stored and automatically deleted after 5 minutes</li>
                        <li>Passwords are encrypted using industry-standard algorithms</li>
                        <li>API communications are secured with authentication tokens</li>
                        <li>We implement reasonable security measures but cannot guarantee absolute security</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Supabase:</strong> Database and authentication services</li>
                        <li><strong>Google Gemini AI:</strong> AI content generation and PDF analysis</li>
                        <li><strong>Render:</strong> API hosting and deployment</li>
                    </ul>
                    <p>These services have their own privacy policies and terms of service. We are not responsible for their practices.</p>
                </section>

                <section className={styles.section}>
                    <h2>7. Data Retention</h2>
                    <ul>
                        <li>Account data: Retained until account deletion</li>
                        <li>PDF files: Automatically deleted after 5 minutes</li>
                        <li>API logs: Retained for debugging and research purposes</li>
                        <li>Chat history: Stored in your account (can be manually deleted)</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Request correction of inaccurate data</li>
                        <li>Request deletion of your account and data</li>
                        <li>Opt-out of data collection (by not using the service)</li>
                        <li>Export your data (contact us for requests)</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>9. Children&apos;s Privacy</h2>
                    <p>When users under 13 years of age access this educational platform, their data and interactions are supervised and filtered by teachers who have been assigned by the administrator.</p>
                    <ul>
                        <li>Teachers assigned by administrators are responsible for managing and monitoring content for underage users</li>
                        <li>Data filtering and content moderation for children under 13 is handled through teacher oversight</li>
                        <li>Teachers can review, filter, and control the AI interactions of their assigned students</li>
                        <li>Parental consent is required and should be obtained by the educational institution or teacher before allowing underage users to access the platform</li>
                        <li>We do not directly collect data from children without appropriate teacher supervision and institutional approval</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>10. No Illegal Activities</h2>
                    <p>This platform is strictly for educational and research purposes. We:</p>
                    <ul>
                        <li>Do not engage in any illegal activities</li>
                        <li>Do not support or facilitate illegal content or actions</li>
                        <li>Reserve the right to terminate accounts engaged in illegal activities</li>
                        <li>Will cooperate with law enforcement if required by law</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>11. Changes to This Privacy Policy</h2>
                    <p>As this is a beta educational project, we may update this Privacy Policy at any time. Changes will be posted on this page with an updated revision date.</p>
                </section>

                <section className={styles.section}>
                    <h2>12. Contact Information</h2>
                    <p>For questions about this Privacy Policy, please contact:</p>
                    <p><strong>Project Owner:</strong> cordyStackX</p>
                    <p><strong>License:</strong> Apache License 2.0</p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a></p>
                </section>

                <div className={styles.disclaimer}>
                    <h2>Disclaimer</h2>
                    <p>This is an educational beta project. Use at your own risk. We provide no warranties and are not liable for any damages arising from use of this service.</p>
                </div>
            </div>
        </section>
    );

}