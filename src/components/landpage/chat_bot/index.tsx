import styles from "./css/styles.module.css";

interface Chat_botProps {
    show: boolean;
    setShow: (val: boolean) => void;
}

export default function Chat_bot({ show, setShow } : Chat_botProps) {

    return(
        <section className={`${styles.container} display_flex_center`}  onClick={() => {setShow(!show);}}>
            <p>Ask Chat bot</p>
        </section>
    );
}