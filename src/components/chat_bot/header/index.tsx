import styles from "./css/styles.module.css";

export default function Header() {
    return(
        <section className={`${styles.container} display_flex_center`}>
            <h1>LACO AI</h1>
        </section>
    );
}