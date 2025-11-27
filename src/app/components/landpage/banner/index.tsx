import styles from "./css/styles.module.css";

export default function Banner() {

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className={`${styles.left_side} display_flex_center`}>
                <h1>LACO AI</h1>
                <p>

                </p>
            </div>
            <div className={styles.right_side}>
                
            </div>
        </section>
    );

}