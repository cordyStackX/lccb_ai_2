"use client";
import styles from "./css/styles.module.css";
import { Progress } from "@/utilities";
import { useEffect } from "react";

export default function Privacy() {

    useEffect(() => {
        Progress(false);
    }, []);


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
                        <li>Email address (used as unique identifier)</li>
                        <li>Full name</li>
                        <li>Password (encrypted using industry-standard hashing)</li>
                        <li>User role (Admin, Teacher, or Student)</li>
                        <li>Year level (for students)</li>
                        <li>Profile picture (optional)</li>
                        <li>Account creation date and timestamps</li>
                        <li>Account status (active/inactive)</li>
                        <li>Email verification status</li>
                    </ul>

                    <h3>3.2 Usage Data</h3>
                    <ul>
                        <li>PDF file uploads (name, size, file path)</li>
                        <li>Chat conversations with AI (prompts and responses)</li>
                        <li>Selected PDF documents for chat context</li>
                        <li>Search queries within PDF lists</li>
                        <li>API request logs and response times</li>
                        <li>User activity timestamps</li>
                        <li>Profile updates and password changes</li>
                        <li>File deletion activities</li>
                    </ul>

                    <h3>3.3 Technical Data</h3>
                    <ul>
                        <li>IP address (for rate limiting and security)</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>JWT authentication tokens (stored in cookies)</li>
                        <li>Local storage data (email for session recovery)</li>
                        <li>Request headers and origin validation</li>
                    </ul>

                    <h3>3.4 Admin and Teacher Data</h3>
                    <ul>
                        <li>Admin users have access to user management features</li>
                        <li>Teachers can monitor and filter content for assigned students</li>
                        <li>Admin activity logs (user creation, status updates, deletions)</li>
                        <li>API usage logs accessible by admins</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. How We Use Your Information</h2>
                    <p>We use collected information for:</p>
                    <ul>
                        <li>User authentication via JWT tokens and email verification</li>
                        <li>Role-based access control (Admin, Teacher, Student)</li>
                        <li>Processing PDF documents with OpenAI for educational chat</li>
                        <li>Generating AI-powered responses to user questions</li>
                        <li>Storing and managing profile pictures</li>
                        <li>Enabling search and filtering of uploaded PDFs</li>
                        <li>Teacher supervision and content filtering for students under 13</li>
                        <li>Admin features: user management, API logs, and system monitoring</li>
                        <li>Rate limiting to prevent spam and abuse (1 request per second per IP)</li>
                        <li>CSRF protection and origin validation</li>
                        <li>Research and educational analysis</li>
                        <li>Debugging and system performance monitoring</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Data Storage and Security</h2>
                    <ul>
                        <li>User data stored in Supabase PostgreSQL database with row-level security</li>
                        <li>Profile pictures stored in Supabase public storage buckets</li>
                        <li>PDF files stored temporarily in Supabase storage buckets</li>
                        <li>Passwords encrypted using bcrypt or similar industry-standard hashing</li>
                        <li>JWT tokens with secret key encryption for session management</li>
                        <li>API endpoints protected with JWT authentication and rate limiting</li>
                        <li>CSRF protection via origin header validation</li>
                        <li>Rate limiting: 1 request per second per IP address to prevent spam</li>
                        <li>Cooldown mechanism tracks requests using in-memory maps</li>
                        <li>Old profile pictures automatically deleted when updating</li>
                        <li>We implement reasonable security measures but cannot guarantee absolute security</li>
                        <li>HTTPS encryption for all data transmission</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Supabase:</strong> PostgreSQL database, authentication, and file storage services</li>
                        <li><strong>OpenAI:</strong> AI-powered chat responses and PDF document analysis</li>
                        <li><strong>Render:</strong> Python API hosting for backend services</li>
                        <li><strong>Vercel/GitHub Pages:</strong> Next.js application deployment</li>
                        <li><strong>Next.js:</strong> React framework for the web application</li>
                    </ul>
                    <p>These services have their own privacy policies and terms of service. We are not responsible for their data handling practices, security measures, or service availability.</p>
                </section>

                <section className={styles.section}>
                    <h2>7. Data Retention</h2>
                    <ul>
                        <li><strong>Account data:</strong> Retained until manual account deletion by user or admin</li>
                        <li><strong>Profile pictures:</strong> Stored permanently until replaced or account deleted</li>
                        <li><strong>PDF files:</strong> Stored in database and storage bucket until manually deleted via context menu</li>
                        <li><strong>Chat history:</strong> Stored indefinitely in your account until manually cleared</li>
                        <li><strong>API logs:</strong> Retained for debugging, research, and admin monitoring purposes</li>
                        <li><strong>Authentication tokens:</strong> JWT tokens expire based on configured session duration</li>
                        <li><strong>Rate limit data:</strong> Stored temporarily in memory; old entries auto-cleaned</li>
                        <li><strong>Verification codes:</strong> Email codes for password reset and verification</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data through your profile settings</li>
                        <li>Update your name and profile picture</li>
                        <li>Change your password via email verification</li>
                        <li>View your uploaded PDFs and chat history</li>
                        <li>Delete individual PDFs via right-click context menu</li>
                        <li>Request correction of inaccurate account data</li>
                        <li>Request deletion of your account and all associated data</li>
                        <li>Export your data (contact us for manual export requests)</li>
                        <li>Opt-out of data collection by not using the service</li>
                        <li>Be informed of data breaches affecting your information</li>
                    </ul>
                    <p><strong>Note:</strong> Profile updates, password changes, and PDF deletions can be performed directly through the application interface.</p>
                </section>

                <section className={styles.section}>
                    <h2>9. User Roles and Permissions</h2>\n                    <h3>9.1 Students</h3>
                    <ul>
                        <li>Can upload and manage their own PDF documents</li>
                        <li>Can chat with AI about their PDFs</li>
                        <li>Can search and filter their PDF library</li>
                        <li>Can update their profile and password</li>
                        <li>Students under 13 require teacher supervision</li>
                    </ul>

                    <h3>9.2 Teachers</h3>
                    <ul>
                        <li>Have all student permissions</li>
                        <li>Can be assigned by administrators to supervise students</li>
                        <li>Responsible for monitoring and filtering content for assigned students under 13</li>
                        <li>Can review student interactions and manage their access</li>
                    </ul>

                    <h3>9.3 Administrators</h3>
                    <ul>
                        <li>Full access to user management features</li>
                        <li>Can create, update, and delete user accounts</li>
                        <li>Can view and manage API usage logs</li>
                        <li>Can assign teacher roles to users</li>
                        <li>Can monitor system health and performance</li>
                        <li>Access to all administrative dashboards and logs</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>10. Children&apos;s Privacy</h2>
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
                    <h2>11. No Illegal Activities</h2>
                    <p>This platform is strictly for educational and research purposes. We:</p>
                    <ul>
                        <li>Do not engage in any illegal activities</li>
                        <li>Do not support or facilitate illegal content or actions</li>
                        <li>Reserve the right to terminate accounts engaged in illegal activities</li>
                        <li>Will cooperate with law enforcement if required by law</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>12. Changes to This Privacy Policy</h2>
                    <p>As this is a beta educational project, we may update this Privacy Policy at any time. Changes will be posted on this page with an updated revision date.</p>
                </section>

                <section className={styles.section}>
                    <h2>13. Contact Information</h2>
                    <p>For questions about this Privacy Policy, please contact:</p>
                    <p><strong>Project Owner:</strong> cordyStackX</p>
                    <p><strong>License:</strong> Apache License 2.0</p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a></p>
                </section>

                <div className={styles.disclaimer}>
                    <h2>Disclaimer</h2>
                    <p><strong>THIS IS A BETA EDUCATIONAL PROJECT FOR RESEARCH AND EXPERIMENTAL PURPOSES ONLY.</strong></p>
                    <p>This is an educational beta project. Use at your own risk. We provide no warranties and are not liable for any damages arising from use of this service. Do not upload sensitive or confidential information. Your data is processed by third-party services including OpenAI.</p>
                </div>
            </div>
        </section>
    );

}