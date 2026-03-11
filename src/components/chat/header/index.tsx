import styles from "./css/styles.module.css";
import { Spin as Hamburger } from "hamburger-react";
import { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import { useState } from "react";
import { Fetch_to, SweetAlert2 } from "@/utilities";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import api_link from "@/config/conf/json_config/fetch_url.json";

interface HeaderProps {
    isOpen: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    name: string;
    email: string;
}


export default function Header({ isOpen, setOpen, name, email }: HeaderProps) {
    const router = useRouter();
    const [profile, setProfile] = useState(false);

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
        <header className={`${styles.container}`}>
            
            <Hamburger toggled={isOpen} toggle={setOpen}  />
            
            <h1>LACO AI</h1>
            <span className={styles.profile} onClick={() => setProfile(!profile)}>
                <span>
                    <Image
                    src={image_src.profile}
                    alt="Profile Pic"
                    width={40}
                    height={40}
                    />
                </span>
                
                <svg
                className={profile ? styles.chevron_open : styles.chevron}
                width="30"
                height="30"
                viewBox="0 0 20 20"
                fill="currentColor"
                >
                <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                />
                </svg>
            </span>
            
            <section className={`${styles.user_info_menu} ${profile ? styles.user_info_menu_open : ''}`}>
                <figure className={styles.profile_info_img}>
                    <span>
                        <Image src={image_src.profile} alt="User Pic" width={70} height={70}/>
                    </span>
                    <div>
                        <figcaption> {name} </figcaption>
                        <p title={email} > {email} </p>
                    </div>
                </figure>
               
                <button className={styles.setting} title="My Profile" onClick={() => {alert("Under Development");}}>My Profile</button>
                <button className={styles.signout} title="Sign Out" onClick={handle_logout}>Sign Out</button>
            </section>

        </header>
    );
}