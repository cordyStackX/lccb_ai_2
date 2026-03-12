import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useRouter } from "next/navigation";
import { Fetch_to, Progress, Fetch_toFile, SweetAlert2 } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface Index {
    showProfile: boolean
    setShowProfile: Dispatch<SetStateAction<boolean>>
    email: string
    name: string
    role: string
    year: string
    profilePic: string
}

export default function Profile({ showProfile, setShowProfile, email, name, role, year, profilePic }: Index) {
    const router = useRouter();
    const profilePicRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        name: "", email: ""
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(image_src.profile);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        setForm(prev => ({ ...prev, email: email || "", name: name || "" }));
        setPreviewUrl(profilePic);
    }, [email, name, profilePic]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl !== image_src.profile) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleProfilePicUpload = () => {
        profilePicRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        // Store the file and create preview
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        
        console.log("Image selected:", file);
    };

    const HandleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            SweetAlert2("Error", "Name cannot be empty", "error", true, "Okay", false, "", false);
            return;
        }

        SweetAlert2("Updating...", "", "info", false, "", false, "", true);

        // Upload profile picture if one is selected
        if (selectedFile) {
            const uploadResponse = await Fetch_toFile(api_link.storage.uploadimg, selectedFile, { email: email });
            
            if (!uploadResponse.success) {
                Progress(false);
                SweetAlert2("Error", `Failed to upload profile picture: ${uploadResponse.message}`, "error", true, "Confirm", false, "", false);
                return;
            }
        }

        // Update profile name
        const response = await Fetch_to(api_link.update, { 
            email: email, 
            name: form.name 
        });
        
        Swal.close();

        if (response.success) {
            await Fetch_to(api_link.jwt.deauth);
            const alert2 = await SweetAlert2("Updated", "Complete", "success", true, "Go to Signin Page", false, "");
            if (alert2.isConfirmed) { router.push("/auth/signin"); }

            setSelectedFile(null); // Clear selected file after successful upload
            if (profilePicRef.current) {
                profilePicRef.current.value = "";
            }

        } else {
            SweetAlert2("Error", `${response.message}`, "error", true, "Confirm", false, "", false);
        }
    };


    return(
        <section className={ `${styles.container} ${showProfile ? styles.container_open : ''}`}>
            <div className={styles.profile_container}>
                
                <span className={styles.title}>
                    <h2>My Profile</h2>
                    <span onClick={() => setShowProfile(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 6L6 18" />
                            <path d="M6 6L18 18" />
                        </svg>
                    </span>
                    
                </span>
                <figure className={styles.profile_img}>
                    <span>
                        <button 
                            type="button"
                            onClick={handleProfilePicUpload}
                            title="Upload your profile picture" 
                        >Upload profile picture</button>
                        <Image 
                        src={previewUrl || image_src.profile}
                        alt="Profile Pic"
                        title="Upload your profile picture"
                        width={180}
                        height={180} 
                        unoptimized
                        />
                    </span>
                </figure>
                <div className={styles.information}>
                    <form onSubmit={HandleSubmit}>
                        <label htmlFor="Name">Name</label>
                        <input type="text" name="name" id="name" value={form.name} onChange={handleChange} />
                        <label htmlFor="Email">Email</label>
                        <input type="text" name="email" id="email" value={form.email} onChange={handleChange} disabled style={{ opacity: "0.8" }}/>
                        <span>
                            <h4>Role: {role} </h4>
                            <h4>Year Level: {year} </h4>
                        </span>
                        {/* Hidden Input for Profile Picture */}
                        <input
                            ref={profilePicRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <span>
                            <button title="Change your password" type="button" 
                            onClick={ async() => {
                                Progress(true);
                                localStorage.setItem("email", email);
                                const responds = await Fetch_to(api_link.checkcode_2, { email: email });
                                if(!responds.success) {
                                    alert(responds.message); 
                                    Progress(false);
                                    return;
                                }
                                router.push("/auth/confirm-email-forgot-pwd");
                            }} >Change Password</button>
                            <button type="submit" title="Update your info">Update</button>
                        </span>
                    </form>
                    
                </div>
                <span className={styles.deleteaccount}>
                    <p><u>Account Deletion {">>"} </u></p>
                </span>
            </div>
        </section>
    );

}