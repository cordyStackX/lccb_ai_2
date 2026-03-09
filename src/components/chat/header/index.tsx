import styles from "./css/styles.module.css";
import Image from "next/image";
// import { SweetAlert2, Fetch_to } from "@/utilities";
import { Spin as Hamburger } from "hamburger-react";
// import Swal from "sweetalert2";
// import api_link from "@/config/conf/json_config/fetch_url.json";
// import { useRouter } from "next/navigation";

export default function Header() {
    // const router = useRouter();

    // const handle_logout = async () => {

    //     const alert2 = await SweetAlert2("Signning Out", "Are you sure want to sign out?", "warning", true, "Yes", true, "No");

    //     if (alert2.isConfirmed) {
    //         SweetAlert2("Signning Out", "", "info", false, "", false, "", true);
    //         const response = await Fetch_to(api_link.jwt.deauth);
    //         Swal.close();
    //         if (response.success) {   
    //             const alert2 = await SweetAlert2("Sign Out", "Complete", "success", true, "Go to Signin Page", false, "");
    //             if (alert2.isConfirmed) { router.push("/auth/signin"); }
    //         } else {
    //             SweetAlert2("Error", "Something went wrong", "error", true, "Ok", false, "");
    //         }
            
    //     } 
    // };


    return(
        <header className={`${styles.container}`}>

            <span>
                <div className={styles.hamburger}><Hamburger  /></div>
                <h1>LACO AI</h1>
            </span>
            <span className={styles.profile}>
                <Image 
                src="/profile.png"
                alt="User Profile"
                width={35}
                height={35}
                />
                <svg
                className={styles.chevron}
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
            

        </header>
    );
}