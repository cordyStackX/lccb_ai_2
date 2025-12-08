import styles from "./css/styles.module.css";
import { Spin as Hamburger } from "hamburger-react";
import { Dispatch, SetStateAction } from "react";

interface HeaderProps {
    isOpen: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}


export default function Header({ isOpen, setOpen }: HeaderProps) {
    return(
        <header className={`${styles.container} display_flex_center`}>
            
            <Hamburger toggled={isOpen} toggle={setOpen}  />
            
            <h1>Welcome to LACO AI</h1>
        </header>
    );
}