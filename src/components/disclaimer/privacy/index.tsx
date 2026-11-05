"use client";
import styles from "./css/styles.module.css";
import { Progress } from "@/utilities";
import { useEffect } from "react";
import Link from "next/link";

export default function Privacy() {

    useEffect(() => {
        Progress(false);
    }, []);


    return(
        <section className={styles.container}>
            <div className={styles.content}>
                <Link href="/" style={{ color: "blue" }} > {"<<"} Go Back</Link>
                <h1>Privacy Policy</h1>
                <p className={styles.updated}>Last Updated: November 5, 2026</p>
                
                <div className={styles.notice}>
                    <h2>⚠️ Important Notice</h2>
                    <p>LACO AI provides AI-powered information services covering schools, businesses, and student academic records. Full sensitive-data features (including student grades) are currently available exclusively to <strong>La Consolacion College Bacolod (LCCB)</strong>. Businesses may sign up for general document analysis under a separate tier described below. This platform is provided &quot;as-is&quot; and is under active development.</p>
                </div>

                <section className={styles.section}>
                    <h2>1. Introduction</h2>
                    <p>Welcome to LACO AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered platform for school, business, and academic-record information services.</p>
                    <p>This project is developed under the Apache License 2.0. We are committed to protecting your privacy and handling your data responsibly.</p>
                </section>

                <section className={styles.section}>
                    <h2>2. Platform Scope</h2>
                    <p>LACO AI operates under two distinct scopes:</p>
                    <ul>
                        <li><strong>Academic (La Consolacion College Bacolod only):</strong> Full access to sensitive student data, including grades, is available exclusively to LCCB. Other schools or institutions seeking full system access must contact us directly to negotiate a separate agreement.</li>
                        <li><strong>Business:</strong> Businesses may sign up for general PDF document analysis under the Free Trial, Pro, or Enterprise tier (see Section 3.5). This tier is not intended for sensitive or confidential data.</li>
                    </ul>
                    <h3>2.1 Account Approval Process</h3>
                    <ul>
                        <li><strong>Student and Teacher (LCCB academic) accounts</strong> are subject to admin review before activation. Your account will remain under review until an administrator approves it.</li>
                        <li><strong>Business accounts</strong> (Free Trial, Pro, Enterprise) do not require admin approval to sign up and access the platform. However, payments submitted for Pro or Enterprise plans are still reviewed by an administrator (see Section 8).</li>
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

                    <h3>3.4 Academic Data (LCCB Only)</h3>
                    <ul>
                        <li>Student ID, student name, school email, year level, and department used to register and match academic records</li>
                        <li>Student grades and other academic information extracted from sensitive PDFs uploaded by an administrator</li>
                        <li>Admin users have access to user management features</li>
                        <li>Admin activity logs (user creation, status updates, deletions)</li>
                        <li>API usage logs accessible by admins</li>
                    </ul>
                    <h4>How sensitive academic records are collected</h4>
                    <p>An authorized administrator uploads a restricted PDF. The system reads its pages and uses AI to extract student IDs and associated academic information. It matches each extracted ID against registered student accounts. Records are filed in that student&apos;s private bookshelf only when the ID matches one unique registered account. Records with missing, invalid, unregistered, or ambiguous IDs are skipped. If an account is registered later, an administrator can recheck the already uploaded PDFs to match and file its records without uploading those PDFs again.</p>

                    <h3>3.5 Business Accounts</h3>
                    <ul>
                        <li><strong>Free Trial:</strong> up to 50 PDF pages and 10,000 API requests during the 1 month trial</li>
                        <li><strong>Pro (₱249/month):</strong> up to 5,000 PDF pages per account and unlimited API requests</li>
                        <li><strong>Enterprise (₱1,499/year):</strong> up to 10,000 PDF pages per account and unlimited API requests</li>
                        <li>Business PDF uploads under all tiers are treated as Public Documents and should not contain sensitive information (see Section 6)</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. How We Use Your Information</h2>
                    <p>We use collected information for:</p>
                    <ul>
                        <li>User authentication via JWT tokens and email verification</li>
                        <li>Role-based access control (Admin, Teacher, Student)</li>
                        <li>Processing public PDFs for document analysis and question answering</li>
                        <li>Processing administrator-uploaded sensitive PDFs with AI to extract academic records and match them to registered student IDs</li>
                        <li>Answering a student&apos;s academic questions using only bookshelf records whose student ID matches that student&apos;s registered ID</li>
                        <li>Storing and managing profile pictures</li>
                        <li>Enabling search and filtering of uploaded PDFs</li>
                        <li>Admin features: user management, API logs, and system monitoring</li>
                        <li>Rate limiting to prevent spam and abuse (1 request per second per IP)</li>
                        <li>CSRF protection and origin validation</li>
                        <li>Enforcing Free Trial, Pro, and Enterprise tier limits for business accounts</li>
                        <li>Reviewing and processing business plan payments, refund requests, and resubmissions</li>
                        <li>Debugging and system performance monitoring</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Data Storage and Security</h2>
                    <ul>
                        <li>User data stored in Supabase PostgreSQL database with row-level security</li>
                        <li>Sensitive PDF files are password-encrypted before being stored, and extracted bookshelf record contents are encrypted before database storage</li>
                        <li>Student IDs in student account records are stored as plaintext identifiers; they are used by the server to match PDF records and are not treated as encrypted values</li>
                        <li>Sensitive PDF and bookshelf access is handled through server-side routes with role and account checks; student chat is limited to records matched to the authenticated student&apos;s registered ID</li>
                        <li>Raw PDF pages and extracted record contents are decrypted in the backend when needed for extraction or authorized record display</li>
                        <li>Profile pictures stored in Supabase public storage buckets</li>
                        <li>PDF files stored in Supabase storage buckets</li>
                        <li>Passwords encrypted using industry-standard hashing</li>
                        <li>Payment account numbers are encrypted at rest and only decrypted for authorized admin review</li>
                        <li>JWT tokens with secret key encryption for session management</li>
                        <li>API endpoints protected with JWT authentication and rate limiting</li>
                        <li>CSRF protection via origin header validation</li>
                        <li>Rate limiting: 1 request per second per IP address to prevent spam</li>
                        <li>Old profile pictures automatically deleted when updating</li>
                        <li>We implement reasonable security measures but cannot guarantee absolute security</li>
                        <li>HTTPS encryption for all data transmission</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Public Documents and Sensitive Data Warning</h2>
                    <p><strong>Business and general users:</strong> PDF documents uploaded outside the LCCB academic scope are treated as Public Documents. Do not upload documents containing passwords, credentials, or other sensitive information into Public Documents.</p>
                    <p><strong>Web-link conversion:</strong> The feature that converts a web link into a PDF is available only for Public Documents. Do not submit links that expose private, restricted, password-protected, or confidential content.</p>
                    <p>La Consolacion College Bacolod is not responsible for any damages, losses, or consequences resulting from sensitive data uploaded into Public Documents by businesses or general users.</p>
                </section>

                <section className={styles.section}>
                    <h2>7. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Supabase:</strong> PostgreSQL database, authentication, and file storage services</li>
                        <li><strong>OpenAI:</strong> AI processing of public documents, sensitive PDF pages for record extraction, and student questions with only the matched student records supplied as chat context</li>
                        <li><strong>Render:</strong> Python API hosting for backend services</li>
                        <li><strong>Vercel/GitHub Pages:</strong> Next.js application deployment</li>
                        <li><strong>Next.js:</strong> React framework for the web application</li>
                    </ul>
                    <p>When an administrator submits a sensitive PDF, its pages and content are sent to OpenAI for extraction. When a student asks about academic records, only records matched to that student&apos;s registered ID are included in the AI request. These providers process information under their own terms and privacy practices.</p>
                </section>

                <section className={styles.section}>
                    <h2>8. Payments and Refunds</h2>
                    <ul>
                        <li>Business accounts on the Pro or Enterprise plan submit payment details, including an account/payment method identifier, for manual admin verification</li>
                        <li>Submitted account numbers are encrypted before being stored; only administrators can review them for verification purposes</li>
                        <li>Each payment is assigned a status: <strong>pending</strong> (awaiting review), <strong>success</strong> (approved and plan activated), <strong>declined</strong> (rejected, with a reason), <strong>refund_requested</strong> (awaiting refund review), or <strong>refunded</strong> (refund processed)</li>
                        <li>You will receive an email notification when you submit a payment, resubmit updated payment details, request a refund, and when an admin approves, declines, or refunds your payment</li>
                        <li>Only one pending payment is allowed per account at a time; you must wait for a decision, or resubmit details if requested, before submitting again</li>
                        <li>Requesting a refund re-encrypts the submitted account number and marks the payment as <strong>refund_requested</strong> pending admin processing</li>
                        <li>Declined payments may include a reason from the admin explaining why verification failed</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>9. Data Retention</h2>
                    <ul>
                        <li><strong>Account data:</strong> Retained until you request deletion by contacting the admin (see Section 10)</li>
                        <li><strong>Profile pictures:</strong> Stored until replaced or account deleted</li>
                        <li><strong>PDF files:</strong> Stored in database and storage bucket until manually deleted via context menu</li>
                        <li><strong>Sensitive academic PDFs and bookshelf records:</strong> Retained until an administrator deletes the PDF or the related account is deleted; deleting a sensitive PDF also removes its associated bookshelf entries</li>
                        <li><strong>Chat history:</strong> Stored indefinitely in your account until manually cleared</li>
                        <li><strong>Payment records:</strong> Retained for accounting and dispute-resolution purposes, with account numbers encrypted</li>
                        <li><strong>API logs:</strong> Retained for debugging, research, and admin monitoring purposes</li>
                        <li><strong>Authentication tokens:</strong> JWT tokens expire based on configured session duration</li>
                        <li><strong>Rate limit data:</strong> Stored temporarily in memory; old entries auto-cleaned</li>
                        <li><strong>OTP verification codes:</strong> Used for password reset and verification, short-lived</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>10. Account Security, Password Recovery, and Deletion</h2>
                    <ul>
                        <li>You retain full control over your own account password</li>
                        <li>Password recovery is self-service via OTP (One-Time Password) sent to your registered email, through <code>/auth/forgot-password</code></li>
                        <li>Admins <strong>cannot</strong> recover or reset your password on your behalf — recovery is only possible through your own email via OTP</li>
                        <li>Account deletion is <strong>not</strong> self-service. To delete your account and wipe all associated data, you must contact the admin email directly</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>11. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data through your profile settings</li>
                        <li>Update your name and profile picture</li>
                        <li>Recover your password via OTP at <code>/auth/forgot-password</code></li>
                        <li>View your uploaded PDFs and chat history</li>
                        <li>Delete individual PDFs via right-click context menu</li>
                        <li>Request correction of inaccurate account data</li>
                        <li>Request full account and data deletion by contacting the admin email</li>
                        <li>Be informed of data breaches affecting your information</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>12. User Roles and Permissions</h2>
                    <h3>12.1 Students and Teachers (LCCB)</h3>
                    <ul>
                        <li>Accounts require admin review and approval before activation</li>
                        <li>Can upload and manage their own public PDF documents</li>
                        <li>Can chat with AI about their own PDFs and academic records matched to their registered student ID</li>
                        <li>Can search and filter their PDF library</li>
                        <li>Can update their profile and recover their password via OTP</li>
                        <li>Students under 13 require Guardian or Parent supervision</li>
                    </ul>

                    <h3>12.2 Administrators</h3>
                    <ul>
                        <li>Full access to user management features</li>
                        <li>Review and approve student/teacher account registrations</li>
                        <li>Upload, recheck, and delete sensitive academic PDFs and review the resulting student bookshelf records</li>
                        <li>Can create, update, and manage user accounts (cannot reset user passwords — recovery is OTP-only)</li>
                        <li>Handle account deletion requests received via admin email</li>
                        <li>Review, approve, decline, or refund business payments</li>
                        <li>Can view and manage API usage logs</li>
                        <li>Can assign teacher roles to users</li>
                        <li>Can monitor system health and performance</li>
                    </ul>

                    <h3>12.3 Business Accounts</h3>
                    <ul>
                        <li>Sign-up does not require admin approval</li>
                        <li>Free Trial: up to 50 PDF pages and 10,000 API requests during the 1 month trial</li>
                        <li>Pro tier (₱249/month): up to 5,000 PDF pages per account and unlimited API requests — payment requires admin verification</li>
                        <li>Enterprise tier (₱1,499/year): up to 10,000 PDF pages per account and unlimited API requests — payment requires admin verification</li>
                        <li>All business tiers use Public Documents and must not upload sensitive or password-containing PDFs; web-link conversion is also limited to Public Documents</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>13. Children&apos;s Privacy</h2>
                    <p>Users under 13 years of age are <strong>not permitted to sign up or use LACO AI without direct parental supervision and consent</strong>.</p>
                    <ul>
                        <li>A parent or legal guardian must provide consent before a child under 13 creates an account or uses the Service</li>
                        <li>A parent or legal guardian is solely responsible for supervising their child&apos;s use of the Service, including AI interactions and PDF uploads</li>
                        <li>We do not knowingly collect data from children under 13 without verified parental consent</li>
                        <li>If we become aware that a child under 13 has registered without parental consent, we will take steps to disable the account and delete associated data</li>
                        <li>Parents or guardians may contact the admin email to review, request deletion of, or ask questions about their child&apos;s data</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>14. No Illegal Activities</h2>
                    <p>This platform is strictly for lawful use. We:</p>
                    <ul>
                        <li>Do not engage in any illegal activities</li>
                        <li>Do not support or facilitate illegal content or actions</li>
                        <li>Reserve the right to terminate accounts engaged in illegal activities</li>
                        <li>Will cooperate with law enforcement if required by law</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>15. Changes to This Privacy Policy</h2>
                    <p>We may update this Privacy Policy at any time. Changes will be posted on this page with an updated revision date.</p>
                </section>

                <section className={styles.section}>
                    <h2>16. Contact Information</h2>
                    <p>For questions about this Privacy Policy, account deletion requests, or negotiating full-system access for other schools, please contact the admin.</p>
                    <p><strong>Project Owner:</strong> cordyStackX</p>
                    <p><strong>License:</strong> Apache License 2.0</p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/cordyStackX/lccb_ai_2" target="_blank" rel="noopener noreferrer">github.com/cordyStackX/lccb_ai_2</a></p>
                </section>

                <div className={styles.disclaimer}>
                    <h2>Disclaimer</h2>
                    <p>Use at your own risk. We provide no warranties beyond what is stated in this policy and are not liable for damages arising from sensitive data uploaded into Public Documents. Your data is processed by third-party services including OpenAI.</p>
                </div>
            </div>
        </section>
    );

}
