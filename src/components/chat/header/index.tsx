import styles from "./css/styles.module.css";
import Image from "next/image";

export default function Header() {
    return(
        <header className={`${styles.container}`}>
            <h1>LACO AI</h1>
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