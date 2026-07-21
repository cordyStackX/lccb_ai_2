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
                <p className={styles.updated}>Last Updated: July 22, 2026</p>

                <div className={styles.notice}>
                    <h2>⚠️ Important Notice</h2>
                    <p>LACO AI is an AI-powered platform providing information about schools, businesses, and student academic records. Full sensitive-data access, including student grades, is currently exclusive to <strong>La Consolacion College Bacolod (LCCB)</strong>. Other schools seeking full system access must contact us to negotiate a separate agreement. Businesses may use general document analysis features under a Free or Enterprise tier.</p>
                </div>

                <section className={styles.section}>
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using LACO AI (&quot;the Service&quot;), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.</p>
                    <p>This Service is licensed under the <strong>Apache License 2.0</strong>. The source code is available at <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a>.</p>
                </section>

                <section className={styles.section}>
                    <h2>2. Platform Scope and Purpose</h2>
                    <ul>
                        <li>LACO AI provides AI-powered information services covering schools, businesses, and academic records</li>
                        <li>Full sensitive academic data access (including student grades) is available exclusively to <strong>La Consolacion College Bacolod (LCCB)</strong></li>
                        <li>Other schools or institutions seeking full system access must contact us to negotiate access</li>
                        <li>Businesses may sign up for general PDF document analysis under a Free or Enterprise tier</li>
                        <li>The Service is subject to bugs, errors, downtime, and ongoing development</li>
                        <li>Provided &quot;AS IS&quot; without warranties beyond what is stated in these Terms</li>
                        <li>May be modified, suspended, or discontinued with reasonable notice where practicable</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. No Illegal Activities</h2>
                    <p>This platform is strictly for lawful purposes. You agree that:</p>
                    <ul>
                        <li>You will not use the Service for any illegal activities or purposes</li>
                        <li>You will not upload, process, or generate illegal, harmful, or malicious content</li>
                        <li>You will not violate any applicable laws, regulations, or third-party rights</li>
                        <li>The Service does not support, facilitate, or condone any illegal activities</li>
                        <li>Any illegal use of the Service may result in immediate account termination and legal action</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. User Accounts and Eligibility</h2>
                    <ul>
                        <li>Users under 13 years old are <strong>not permitted to sign up or use the Service without direct parental supervision and consent</strong></li>
                        <li>A parent or legal guardian must provide consent before a child under 13 creates an account</li>
                        <li>A parent or legal guardian is solely responsible for supervising their child&apos;s use of the Service</li>
                        <li>Accounts found to belong to a child under 13 without verified parental consent may be disabled, and associated data deleted</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials and JWT tokens</li>
                        <li>You are responsible for all activities that occur under your account</li>
                        <li>Password recovery is self-service via OTP sent to your registered email at <code>/auth/forgot-password</code>. Admins cannot reset your password for you.</li>
                        <li>Account deletion is not self-service — to delete your account and all associated data, you must contact the admin email</li>
                        <li>We reserve the right to terminate accounts at our discretion, especially for policy violations</li>
                    </ul>

                    <h3>Platform Features by Role</h3>
                    <p><strong>LCCB Students and Teacher can:</strong></p>
                    <ul>
                        <li>Upload PDF documents (stored until manual deletion via right-click menu)</li>
                        <li>Search and filter PDFs by name</li>
                        <li>Chat with AI about selected PDFs and their own academic records</li>
                        <li>Update profile name and upload profile picture</li>
                        <li>Recover password via OTP</li>
                    </ul>
                    <p><strong>Administrators additionally can:</strong></p>
                    <ul>
                        <li>Manage user accounts (create, update; cannot reset user passwords)</li>
                        <li>Process account deletion requests received via admin email</li>
                        <li>View API logs and usage statistics</li>
                        <li>Assign roles and monitor system health</li>
                    </ul>
                    <p><strong>Business accounts can:</strong></p>
                    <ul>
                        <li>Free tier: upload up to 1 PDF for analysis</li>
                        <li>Enterprise tier (paid subscription): upload up to 20 PDFs for analysis</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Acceptable Use Policy</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Upload sensitive, confidential, or password-containing data into Public Documents (business/general PDF uploads)</li>
                        <li>Use the Service for any illegal, harmful, fraudulent, or malicious purposes</li>
                        <li>Attempt to bypass JWT authentication, rate limiting, or CSRF protection</li>
                        <li>Spam the API or abuse the 1 request per second rate limit</li>
                        <li>Reverse engineer, decompile, or extract source code (except as permitted by Apache License 2.0)</li>
                        <li>Overload or perform denial-of-service attacks on the infrastructure</li>
                        <li>Upload copyrighted PDFs without proper authorization</li>
                        <li>Use the AI chat feature to generate harmful, offensive, discriminatory, or inappropriate content</li>
                        <li>Share account credentials or JWT tokens with unauthorized parties</li>
                        <li>Attempt to access other users&apos; PDFs, chats, academic records, or profile data</li>
                        <li>Abuse admin or teacher privileges for unauthorized purposes</li>
                        <li>Manipulate or falsify role assignments (admin, teacher, student)</li>
                        <li>Attempt to exceed your business tier{"'"}s upload limit through unauthorized means</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Public Documents Warning (Business/General Uploads)</h2>
                    <p>PDF documents uploaded by businesses or general users are treated as Public Documents and must not contain passwords, credentials, or other sensitive information.</p>
                    <p><strong>La Consolacion College Bacolod is not liable for any damages arising from sensitive data uploaded into Public Documents by businesses or general users.</strong></p>
                </section>

                <section className={styles.section}>
                    <h2>7. Service Availability and Limitations</h2>
                    <ul>
                        <li>We may experience downtime, bugs, errors, or data loss</li>
                        <li>PDF files are stored until manually deleted via right-click context menu</li>
                        <li>Profile pictures are stored until replaced or account deleted</li>
                        <li>AI responses powered by OpenAI (gpt-4o-mini) may be inaccurate, incomplete, biased, or unreliable</li>
                        <li>Large PDF files may experience processing delays, timeouts, or failures</li>
                        <li>Rate limiting enforced: 1 request per second per IP address</li>
                        <li>Exceeding rate limits results in HTTP 429 {'"'}Too Many Requests{'"'} errors</li>
                        <li>Password recovery requires OTP verification via your registered email</li>
                        <li>JWT tokens may expire, requiring re-authentication</li>
                        <li>Search functionality limited to file names only</li>
                        <li>Chat history persists indefinitely unless manually cleared</li>
                        <li>Free-tier business accounts limited to 1 PDF upload; Enterprise limited to 20</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>8. Intellectual Property</h2>
                    <ul>
                        <li>This project is licensed under the <strong>Apache License 2.0</strong></li>
                        <li>Source code is available on GitHub for educational purposes</li>
                        <li>You retain ownership of content you upload (PDFs, prompts)</li>
                        <li>AI-generated content is provided for informational use only</li>
                        <li>You may not claim ownership of the platform code without proper attribution</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>9. Third-Party Services</h2>
                    <p>This Service integrates with:</p>
                    <ul>
                        <li><strong>Supabase:</strong> PostgreSQL database, user authentication, and file storage</li>
                        <li><strong>OpenAI (gpt-4o-mini):</strong> AI-powered chat responses and document analysis</li>
                        <li><strong>Render:</strong> Python API backend hosting</li>
                        <li><strong>Vercel/GitHub Pages:</strong> Next.js frontend deployment</li>
                    </ul>
                    <p>These services have their own terms and privacy policies. We are not responsible for their practices, availability, outages, data breaches, or data handling. OpenAI processes your PDF content and prompts according to their terms of service.</p>
                </section>

                <section className={styles.section}>
                    <h2>10. Data and Privacy</h2>
                    <ul>
                        <li>Your data is handled according to our Privacy Policy</li>
                        <li>Sensitive data and document summaries are encrypted</li>
                        <li>PDF files are stored in Supabase storage buckets until you manually delete them</li>
                        <li>Profile pictures stored until replaced or account deleted</li>
                        <li>Chat conversations stored indefinitely in your account</li>
                        <li>We log API requests, timestamps, and errors for research and debugging</li>
                        <li>Admins can access user management features and API logs, but cannot reset user passwords or delete accounts without a request via admin email</li>
                        <li>Teachers can monitor content for LCCB students under their supervision</li>
                        <li>Rate limiting tracks IP addresses temporarily for spam prevention</li>
                        <li>JWT authentication tokens stored in HTTP-only cookies</li>
                        <li>We cannot guarantee the security or confidentiality of your data</li>
                        <li><strong>Do not upload sensitive or confidential information into Public Documents</strong></li>
                        <li><strong>Your PDF content is sent to OpenAI for processing</strong></li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>11. Disclaimer of Warranties</h2>
                    <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</p>
                    <ul>
                        <li>Warranties of merchantability or fitness for a particular purpose</li>
                        <li>Warranties of accuracy, reliability, or completeness</li>
                        <li>Warranties of uninterrupted or error-free operation</li>
                        <li>Warranties of data security or protection</li>
                    </ul>
                    <p><strong>Use this service at your own risk.</strong></p>
                </section>

                <section className={styles.section}>
                    <h2>12. Limitation of Liability</h2>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                    <ul>
                        <li>We are not liable for any damages arising from use of the Service</li>
                        <li>We are not liable for data loss, service interruptions, or errors</li>
                        <li>We are not liable for AI-generated content accuracy or consequences</li>
                        <li>We are not liable for third-party service failures or data breaches</li>
                        <li>La Consolacion College Bacolod is not liable for damages arising from sensitive data uploaded into Public Documents by businesses or general users</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>13. Indemnification</h2>
                    <p>You agree to indemnify and hold harmless the project owner, contributors, La Consolacion College Bacolod, and service providers from any claims, damages, or expenses arising from:</p>
                    <ul>
                        <li>Your use or misuse of the Service</li>
                        <li>Your violation of these Terms</li>
                        <li>Your violation of any applicable laws or regulations</li>
                        <li>Content you upload or generate using the Service, including sensitive data uploaded into Public Documents</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>14. Apache License 2.0</h2>
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
                    <h2>15. Termination</h2>
                    <p>We reserve the right to:</p>
                    <ul>
                        <li>Terminate or suspend your account at any time for policy violations</li>
                        <li>Modify or discontinue the Service without liability</li>
                        <li>Remove content that violates these Terms</li>
                        <li>Report illegal activities to law enforcement</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>16. Changes to Terms</h2>
                    <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
                </section>

                <section className={styles.section}>
                    <h2>17. Governing Law</h2>
                    <p>These Terms are governed by applicable laws. Any disputes shall be resolved in accordance with the laws of the jurisdiction where the project owner resides.</p>
                </section>

                <section className={styles.section}>
                    <h2>18. Contact Information</h2>
                    <p>For account deletion requests, password issues beyond OTP recovery, or to negotiate full-system access for another school, contact the admin.</p>
                    <p><strong>Project Owner:</strong> cordyStackX</p>
                    <p><strong>License:</strong> Apache License 2.0</p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a></p>
                    <p><strong>Copyright:</strong> 2025 cordyStackX</p>
                </section>

                <div className={styles.disclaimer}>
                    <h2>Final Disclaimer</h2>
                    <p>LACO AI provides AI-powered information about schools, businesses, and academic records. We do not engage in or support any illegal activities. Do not upload sensitive or password-containing data into Public Documents. Use this service at your own risk with full understanding of its scope and limitations.</p>
                </div>
            </div>
        </section>
    );

}