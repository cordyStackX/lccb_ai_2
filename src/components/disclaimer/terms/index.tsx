"use client";
import styles from "./css/styles.module.css";
import { Progress } from "@/utilities";
import { useEffect } from "react";

export default function Terms() {

    useEffect(() => {
        Progress(false);
    }, []);
    
    return(
        <section className={styles.container}>
            <div className={styles.content}>
                <h1>Terms and Conditions</h1>
                <p className={styles.updated}>Last Updated: March 12, 2026</p>

                <div className={styles.notice}>
                    <h2>⚠️ Important Notice</h2>
                    <p>This is a <strong>BETA VERSION</strong> educational project. By using this service, you acknowledge that this platform is for research, educational, and experimental purposes only. This is not a production-ready application.</p>
                </div>

                <section className={styles.section}>
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using LACO AI (&quot;the Service&quot;), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.</p>
                    <p>This Service is licensed under the <strong>Apache License 2.0</strong>. The source code is available at <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a>.</p>
                </section>

                <section className={styles.section}>
                    <h2>2. Educational and Experimental Purpose</h2>
                    <p>This Service is:</p>
                    <ul>
                        <li>A <strong>beta version</strong> educational research project</li>
                        <li>Intended solely for educational, research, and experimental purposes</li>
                        <li>Not designed or intended for commercial, production, or professional use</li>
                        <li>Subject to bugs, errors, downtime, and data loss</li>
                        <li>Provided &quot;AS IS&quot; without any warranties or guarantees</li>
                        <li>May be modified, suspended, or discontinued at any time without notice</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. No Illegal Activities</h2>
                    <p>This platform is strictly for lawful, educational purposes. You agree that:</p>
                    <ul>
                        <li>You will not use the Service for any illegal activities or purposes</li>
                        <li>You will not upload, process, or generate illegal, harmful, or malicious content</li>
                        <li>You will not violate any applicable laws, regulations, or third-party rights</li>
                        <li>The Service does not support, facilitate, or condone any illegal activities</li>
                        <li>Any illegal use of the Service may result in immediate account termination and legal action</li>
                    </ul>
                    <p><strong>We do not engage in or support any illegal activities. This platform is for research and educational purposes only.</strong></p>
                </section>

                <section className={styles.section}>
                    <h2>4. User Accounts and Eligibility</h2>
                    <ul>
                        <li>Users 13 years and older can create and use accounts independently</li>
                        <li>Users under 13 years old may access the Service only under the supervision of teachers assigned by administrators</li>
                        <li>For underage users, teachers are responsible for managing accounts, monitoring content, and filtering data</li>
                        <li>Educational institutions must obtain appropriate parental consent before allowing underage users to access the platform</li>
                        <li>You must provide accurate and current information during registration (email, name, role, year level)</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials and JWT tokens</li>
                        <li>You are responsible for all activities that occur under your account</li>
                        <li>We reserve the right to terminate accounts at our discretion, especially for policy violations</li>
                        <li>Email verification required for password reset and account recovery</li>
                    </ul>

                    <h3>Platform Features by Role</h3>
                    <p><strong>Students can:</strong></p>
                    <ul>
                        <li>Upload PDF documents (stored until manual deletion via right-click menu)</li>
                        <li>Search and filter PDFs by name</li>
                        <li>Chat with OpenAI about selected PDFs</li>
                        <li>Update profile name and upload profile picture</li>
                        <li>Change password with email verification</li>
                    </ul>
                    <p><strong>Teachers additionally can:</strong></p>
                    <ul>
                        <li>Supervise and monitor students under 13 years old</li>
                        <li>Filter and manage content for assigned students</li>
                    </ul>
                    <p><strong>Administrators additionally can:</strong></p>
                    <ul>
                        <li>Manage user accounts (create, update, delete)</li>
                        <li>View API logs and usage statistics</li>
                        <li>Assign roles and monitor system health</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Acceptable Use Policy</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Upload sensitive, confidential, classified, or personal data to PDFs</li>
                        <li>Use the Service for any illegal, harmful, fraudulent, or malicious purposes</li>
                        <li>Attempt to bypass JWT authentication, rate limiting, or CSRF protection</li>
                        <li>Spam the API or abuse the 1 request per second rate limit</li>
                        <li>Reverse engineer, decompile, or extract source code (except as permitted by Apache License 2.0)</li>
                        <li>Overload or perform denial-of-service attacks on the infrastructure</li>
                        <li>Upload copyrighted PDFs without proper authorization</li>
                        <li>Use the AI chat feature to generate harmful, offensive, discriminatory, or inappropriate content</li>
                        <li>Share account credentials or JWT tokens with unauthorized parties</li>
                        <li>Attempt to access other users&apos; PDFs, chats, or profile data</li>
                        <li>Abuse admin or teacher privileges for unauthorized purposes</li>
                        <li>Manipulate or falsify role assignments (admin, teacher, student)</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Service Availability and Limitations</h2>
                    <ul>
                        <li>This is a beta service with no guaranteed uptime or availability</li>
                        <li>We may experience downtime, bugs, errors, or data loss</li>
                        <li>PDF files are stored until manually deleted via right-click context menu</li>
                        <li>Profile pictures are stored permanently until replaced or account deleted</li>
                        <li>AI responses powered by OpenAI may be inaccurate, incomplete, biased, or unreliable</li>
                        <li>Large PDF files may experience processing delays, timeouts, or failures</li>
                        <li>Rate limiting enforced: 1 request per second per IP address</li>
                        <li>Exceeding rate limits results in HTTP 429 {'"'}Too Many Requests{'"'} errors</li>
                        <li>Email verification required for password reset and account recovery</li>
                        <li>JWT tokens may expire, requiring re-authentication</li>
                        <li>Search functionality limited to file names only</li>
                        <li>Chat history persists indefinitely unless manually cleared</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>7. Intellectual Property</h2>
                    <ul>
                        <li>This project is licensed under the <strong>Apache License 2.0</strong></li>
                        <li>Source code is available on GitHub for educational purposes</li>
                        <li>You retain ownership of content you upload (PDFs, prompts)</li>
                        <li>AI-generated content is provided for educational use only</li>
                        <li>You may not claim ownership of the platform code without proper attribution</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Third-Party Services</h2>
                    <p>This Service integrates with:</p>
                    <ul>
                        <li><strong>Supabase:</strong> PostgreSQL database, user authentication, and file storage</li>
                        <li><strong>OpenAI:</strong> AI-powered chat responses and PDF document analysis</li>
                        <li><strong>Render:</strong> Python FastAPI backend hosting</li>
                        <li><strong>Vercel/GitHub Pages:</strong> Next.js frontend deployment</li>
                    </ul>
                    <p>These services have their own terms and privacy policies. We are not responsible for their practices, availability, outages, data breaches, or data handling. OpenAI processes your PDF content and prompts according to their terms of service.</p>
                </section>

                <section className={styles.section}>
                    <h2>9. Data and Privacy</h2>
                    <ul>
                        <li>Your data is handled according to our Privacy Policy</li>
                        <li>PDF files are stored in Supabase storage buckets until you manually delete them</li>
                        <li>Profile pictures stored permanently until replaced or account deleted</li>
                        <li>Chat conversations stored indefinitely in your account</li>
                        <li>We log API requests, timestamps, and errors for research and debugging</li>
                        <li>Admins can access user management features and API logs</li>
                        <li>Teachers can monitor content for students under their supervision</li>
                        <li>Rate limiting tracks IP addresses temporarily for spam prevention</li>
                        <li>JWT authentication tokens stored in HTTP-only cookies</li>
                        <li>Email addresses stored in local storage for session recovery</li>
                        <li>We cannot guarantee the security or confidentiality of your data</li>
                        <li><strong>Do not upload sensitive, confidential, or personal information</strong></li>
                        <li><strong>Your PDF content is sent to OpenAI for processing</strong></li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>10. Disclaimer of Warranties</h2>
                    <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</p>
                    <ul>
                        <li>Warranties of merchantability or fitness for a particular purpose</li>
                        <li>Warranties of accuracy, reliability, or completeness</li>
                        <li>Warranties of uninterrupted or error-free operation</li>
                        <li>Warranties of data security or protection</li>
                    </ul>
                    <p><strong>This is a beta educational project. Use at your own risk.</strong></p>
                </section>

                <section className={styles.section}>
                    <h2>11. Limitation of Liability</h2>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                    <ul>
                        <li>We are not liable for any damages arising from use of the Service</li>
                        <li>We are not liable for data loss, service interruptions, or errors</li>
                        <li>We are not liable for AI-generated content accuracy or consequences</li>
                        <li>We are not liable for third-party service failures or data breaches</li>
                        <li>Our total liability shall not exceed $0 (zero dollars)</li>
                    </ul>
                    <p><strong>This is an educational project with no commercial value or warranties.</strong></p>
                </section>

                <section className={styles.section}>
                    <h2>12. Indemnification</h2>
                    <p>You agree to indemnify and hold harmless the project owner, contributors, and service providers from any claims, damages, or expenses arising from:</p>
                    <ul>
                        <li>Your use or misuse of the Service</li>
                        <li>Your violation of these Terms</li>
                        <li>Your violation of any applicable laws or regulations</li>
                        <li>Content you upload or generate using the Service</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>13. Apache License 2.0</h2>
                    <p>This project is licensed under the Apache License 2.0. Key points:</p>
                    <ul>
                        <li>You may use, modify, and distribute the code</li>
                        <li>You must include the license and copyright notice</li>
                        <li>You must state significant changes made to the code</li>
                        <li>The software is provided without warranty</li>
                        <li>Contributors are not liable for damages</li>
                    </ul>
                    <p>Full license text available at: <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">apache.org/licenses/LICENSE-2.0</a></p>
                </section>

                <section className={styles.section}>
                    <h2>14. Termination</h2>
                    <p>We reserve the right to:</p>
                    <ul>
                        <li>Terminate or suspend your account at any time without notice</li>
                        <li>Modify or discontinue the Service without liability</li>
                        <li>Remove content that violates these Terms</li>
                        <li>Report illegal activities to law enforcement</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>15. Changes to Terms</h2>
                    <p>As this is a beta educational project, we may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
                </section>

                <section className={styles.section}>
                    <h2>16. Governing Law</h2>
                    <p>These Terms are governed by applicable laws. Any disputes shall be resolved in accordance with the laws of the jurisdiction where the project owner resides.</p>
                </section>

                <section className={styles.section}>
                    <h2>17. Contact Information</h2>
                    <p><strong>Project Owner:</strong> cordyStackX</p>
                    <p><strong>License:</strong> Apache License 2.0</p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a></p>
                    <p><strong>Copyright:</strong> 2025 cordyStackX</p>
                </section>

                <div className={styles.disclaimer}>
                    <h2>Final Disclaimer</h2>
                    <p><strong>THIS IS A BETA EDUCATIONAL PROJECT FOR RESEARCH AND EXPERIMENTAL PURPOSES ONLY.</strong></p>
                    <p>This platform is not intended for production use, commercial purposes, or processing sensitive data. We do not engage in or support any illegal activities. Use this service at your own risk with full understanding of its educational and experimental nature.</p>
                </div>
            </div>
        </section>
    );

}