import styles from "./css/styles.module.css";

export default function Terms() {

    return(
        <section className={styles.container}>
            <div className={styles.content}>
                <h1>Terms and Conditions</h1>
                <p className={styles.updated}>Last Updated: December 13, 2025</p>

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
                        <li>You must provide accurate and current information during registration</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                        <li>You are responsible for all activities that occur under your account</li>
                        <li>We reserve the right to terminate accounts at our discretion</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. Acceptable Use Policy</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Upload or process sensitive, confidential, or personal data</li>
                        <li>Use the Service for any illegal, harmful, or malicious purposes</li>
                        <li>Attempt to bypass security measures or access unauthorized features</li>
                        <li>Reverse engineer, decompile, or extract source code</li>
                        <li>Overload or disrupt the Service infrastructure</li>
                        <li>Upload copyrighted material without proper authorization</li>
                        <li>Use the Service to generate harmful, offensive, or inappropriate content</li>
                        <li>Share account credentials with unauthorized parties</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Service Availability and Limitations</h2>
                    <ul>
                        <li>This is a beta service with no guaranteed uptime or availability</li>
                        <li>We may experience downtime, bugs, errors, or data loss</li>
                        <li>PDF files are automatically deleted after 5 minutes</li>
                        <li>AI responses may be inaccurate, incomplete, or unreliable</li>
                        <li>Large PDF files (900+ pages) may experience processing delays or failures</li>
                        <li>API rate limits and usage restrictions may apply</li>
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
                        <li><strong>Supabase:</strong> Database and authentication</li>
                        <li><strong>Google Gemini AI:</strong> AI content generation</li>
                        <li><strong>Render:</strong> API hosting</li>
                    </ul>
                    <p>These services have their own terms and privacy policies. We are not responsible for their practices, availability, or data handling.</p>
                </section>

                <section className={styles.section}>
                    <h2>9. Data and Privacy</h2>
                    <ul>
                        <li>Your data is handled according to our Privacy Policy</li>
                        <li>PDF files are temporarily stored and deleted after 5 minutes</li>
                        <li>We log API requests for research and debugging purposes</li>
                        <li>We cannot guarantee the security or confidentiality of your data</li>
                        <li><strong>Do not upload sensitive, confidential, or personal information</strong></li>
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