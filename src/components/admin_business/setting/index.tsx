"use client";
import styles from "./css/styles.module.css";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Fetch_to, SweetAlert2, Fetch_toFile, Popup_info } from "@/utilities";
import Swal from "sweetalert2";

type SettingProps = {
    email: string;
    f_name: string;
}

export default function Setting({ email, f_name } : SettingProps) {
    const router = useRouter();
    const [suspensionState, setSuspensionState] = useState("off");
    const [loading, setLoading] = useState(true);

    const [schoolName, setSchoolName] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [savingBranding, setSavingBranding] = useState(false);
    const [loadingBranding, setLoadingBranding] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isLoadState, setIsLoadState] = useState(false);
    const [isLoadStateDone, setIsLoadStateDone] = useState(false);
    const [isLoadError, setIsLoadError] = useState(false);
    const [isLoadStatus, setIsLoadStatus] = useState("");

    useEffect(() => {
        // Fetch current suspension state
        const fetchSuspensionState = async () => {
            try {

                const response = await Fetch_to(api_link.admin.get_suspension_state, { email: email });

                if (response.success) {
                    setSuspensionState(response.data?.message[0]?.state || "off");
                    
                }

            } catch (e) {
                console.error("Failed to fetch suspension state:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchSuspensionState();
    }, [loading]);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await Fetch_to(api_link.storage.fetchimg, { email: email });
                if (response.success) {
                    setLogoPreview(response.data.message[0]?.file_link || null);
                }
            } catch (e) {
                console.error("Failed to fetch branding:", e);
            } finally {
                setLoadingBranding(false);
            }
        };
        fetchBranding();
    }, [email]);

    const ChangePassword = async () => {
        localStorage.setItem("email", email);
        const response = await Fetch_to(api_link.checkcode, { email: email });
        if (!response.success) return alert(response.message || "Something went wrong to the server find a developer to fix this problem");
        router.push("/auth/confirm-email-forgot-pwd");
    };

    const handleSuspensionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        setSuspensionState(newState);

        const alert2 = await SweetAlert2("Update?", `Are you sure want to ${newState} API Routes`, "warning", true, "Yes", true, "No");
        if (!alert2.isConfirmed) return setLoading(!loading);

        setIsLoadState(true);
        setIsLoadStateDone(true);
        setIsLoadStatus("Updating Please Wait...");

        try {
            const response = await Fetch_to(api_link.admin.set_suspension_state, { state: newState, email: email });

            if (!response.success) {
                Swal.close();
                setSuspensionState(suspensionState); // Revert on failure
            } else {
                Swal.close();
                setIsLoadStateDone(false);
                setIsLoadStatus(response.data.message);
                setTimeout(() => setIsLoadState(false), 3000);
            }
        } catch (e) {
            console.error("Error updating suspension state:", e);
            setIsLoadStateDone(false);
            setIsLoadStatus(`{e}`);
            setIsLoadError(true);
            setTimeout(() => setIsLoadState(false), 3000);
            setSuspensionState(suspensionState); // Revert on error
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            SweetAlert2("Invalid file", "Please select an image file", "error", true, "Ok", false, "");
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            SweetAlert2("Too large", "Logo must be under 3MB", "error", true, "Ok", false, "");
            return;
        }

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSaveBranding = async () => {
        let response;
        setSavingBranding(true);
        try {

            if (logoFile) {
                // Logo + name together via the multipart helper
                response = await Fetch_toFile(
                    api_link.storage.uploadimg,
                    logoFile,
                    { email: email }
                );

            }

            if (schoolName) {
                response = await Fetch_to(api_link.update, { name: schoolName, email: email });
            }

        } catch (e) {
            SweetAlert2("Error", `${e}`, "error", true, "Confirm", false, "", false);
        } finally {
            setSavingBranding(false);
            SweetAlert2("Success", response?.data.message, "success", true, "Confirm", false, "");
            await Fetch_to(api_link.jwt.auth, { email: email });
        }
    };

    const isSuspended = suspensionState === "suspend";

    return (
        <section className={styles.container}>
            {isLoadState ? (
                isLoadStateDone ? (
                    <Popup_info status={isLoadStatus} bg_color="var(--primary)" states={true} load={true} error={false} />
                ) : (
                    isLoadError ? (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-red)" states={false} load={true} error={true} />
                    ) : (
                        <Popup_info status={isLoadStatus} bg_color="var(--default-color-green)" states={false} load={true} error={false} />
                    )
                )
                
             ) : null}
            <div className={styles.wrapper}>
                <span className={styles.title}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
                        <circle cx="9" cy="6" r="2" fill="currentColor" />
                        <circle cx="15" cy="12" r="2" fill="currentColor" />
                        <circle cx="11" cy="18" r="2" fill="currentColor" />
                    </svg>
                    <h2>System Settings</h2>
                </span>

                <div className={styles.settings}>
                    <h3 className={styles.sectionLabel}>Branding</h3>
                    <div className={styles.brandingRow}>
                        <div className={styles.logoUpload}>
                            <button
                                type="button"
                                className={styles.logoDropzone}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {loadingBranding ? (
                                    <span className={`${styles.skeletonBar} ${styles.skeletonLogo}`} />
                                ) : logoPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoPreview} alt="School logo" className={styles.logoPreviewImg} />
                                ) : (
                                    <span className={styles.logoPlaceholder}>
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                            <path d="M21 15l-5-5-11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Upload logo</span>
                                    </span>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoSelect}
                                className={styles.hiddenFileInput}
                            />
                        </div>

                        <div className={styles.brandingFields}>
                            <div>
                                <p>School / Company name</p>
                                <span className={styles.hint}>
                                    Shown across the admin panel and login screen
                                </span>
                            </div>
                            <input
                                type="text"
                                className={styles.nameInput}
                                placeholder={f_name ? f_name : "e.g. Laco Learning Institute"}
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                disabled={loadingBranding}
                            />
                            <button
                                className={styles.primaryButton}
                                onClick={handleSaveBranding}
                                disabled={savingBranding || loadingBranding}
                            >
                                {savingBranding ? "Saving..." : "Save Branding"}
                            </button>
                        </div>
                    </div>

                    <h3 className={styles.sectionLabel}>General</h3>
                    <div className={styles.settingRow}>
                        <div>
                            <p>Admin password</p>
                            <span className={styles.hint}>Update the password used to sign in</span>
                        </div>
                        <button className={styles.primaryButton} onClick={ChangePassword}>Change</button>
                    </div>

                    <h3 className={styles.sectionLabel}>Emergency Suspensions</h3>
                    <div className={styles.settingRow}>
                        <div>
                            <p>API connections</p>
                            <span className={styles.hint}>
                                Immediately blocks API route requests when suspended
                            </span>
                        </div>
                        <div className={styles.controlGroup}>
                            <span
                                className={`${styles.statusBadge} ${isSuspended ? styles.statusSuspended : styles.statusOpen}`}
                            >
                                <span className={styles.statusDot} />
                                {loading ? "Checking..." : isSuspended ? "Suspended" : "Open"}
                            </span>
                            <select
                                className={styles.select}
                                value={suspensionState}
                                onChange={handleSuspensionChange}
                                disabled={loading}
                            >
                                <option value="open">Open</option>
                                <option value="suspend">Suspend</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

}