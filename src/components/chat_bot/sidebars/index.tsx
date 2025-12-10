"use client";
import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useState, useEffect } from "react";
import { SweetAlert2, Fetch_to } from "@/utilities";
import { useRouter } from "next/navigation";
import { ProgressBar } from "react-loader-spinner";
import Swal from "sweetalert2";
import api_link from "@/config/conf/json_config/fetch_url.json";

interface SidebarsProps {
    isOpen: boolean;
    emailRes: string;
    refresh: boolean;
    setCurrentPdf: (val: number | undefined) => void;}

interface PdfFile {
    id?: number;
    file_name?: string;
}

export default function Sidebars({ isOpen, emailRes, refresh, setCurrentPdf }: SidebarsProps) {
    const router = useRouter();
    const [profile, setProfile] = useState(false);
    const [data, setData] = useState<PdfFile[]>([]);
    const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();

    useEffect(() => {
        if (profile) setProfile(false);
    }, [isOpen]);

    useEffect(() => {
        const retrieve_pdf = async () => {
            const response = await Fetch_to(api_link.storage.retrieve, { email: emailRes });
            if (response.success) {
                console.log(response.data.message);
                setData(response.data.message);
            }
        };
        retrieve_pdf();
        setCurrentPdf(selectedPdfId);
    }, [emailRes, refresh, selectedPdfId]);

    const handle_logout = async () => {

        const alert2 = await SweetAlert2("Signning Out", "Are you sure want to sign out?", "warning", true, "Yes", true, "No");

        if (alert2.isConfirmed) {
            SweetAlert2("Signning Out", "", "info", false, "", false, "", true);
            const response = await Fetch_to(api_link.jwt.deauth);
            Swal.close();
            if (response.success) {   
                const alert2 = await SweetAlert2("Sign Out", "Complete", "success", true, "Go to Signin Page", false, "");
                if (alert2.isConfirmed) { router.push("/auth/signin"); }
            } else {
                SweetAlert2("Error", "Something went wrong", "error", true, "Ok", false, "");
            }
            
        } 
    };

    return(
        <aside className={`${styles.container} ${isOpen ? styles.open : ""}`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                <section className={styles.options}>
                    <button onClick={() => {window.location.reload();}}>Clear Chat</button>
                <section className={`${styles.chat_history} display_flex_center`}>
                    <select disabled>
                        <option>Your Documents</option>
                    </select>
                    {data && data.length > 0 ? (
                        data.map((pdf, index) => (
                            <button key={index}
                            onClick={() => setSelectedPdfId(pdf.id)}
                            style={{
                                backgroundColor: pdf.id === selectedPdfId ? "#fff" : "",
                                color: pdf.id === selectedPdfId ? "#000" : ""
                            }}
                            >{pdf.file_name} {`(${pdf.id})`}</button>
                        ))
                    ) : (
                        <ProgressBar visible={true}
                        height="80"
                        width="80"
                        color="#4fa94d"
                        ariaLabel="progress-bar-loading"
                        />
                    )}
                </section>
                </section>
                <section className={styles.user_info}>
                    <figure className="display_flex_center" onClick={() => {setProfile(!profile);}}>
                        <img src={image_src.logo1} alt="User Pic" width={60} height={60}/>
                        <figcaption>{emailRes ? emailRes : " --- "}</figcaption>
                    </figure>
                </section>
               
                <section className={`${styles.user_info_menu} display_flex_center ${profile ? styles.user_info_menu_open : ''}`}>
                    <span onClick={() => {setProfile(false);}}>X</span>
                    <figure className="display_flex_center">
                        <Image src={image_src.logo1} alt="User Pic" width={60} height={60}/>
                        {emailRes ? (
                            <div>
                                <figcaption> --- </figcaption>
                                <p> {emailRes} </p>
                            </div>
                        ) : (
                            <div>
                                <figcaption> --- </figcaption>
                                <p> --- </p>
                            </div>
                        )}
                        
                    </figure>
                    <button onClick={() => {router.push("/user/settings");}}>Setting</button>
                    <button onClick={handle_logout}>Sign Out</button>
                </section>
               
            </div>
        </aside>
    );
}

