import styles from "./css/styles.module.css";

export default function Banner() {

    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className={`${styles.wrapper} display_flex_center`}>
                <section className={styles.left_side}>
                    <h1>LACO Artificial Intelligence</h1>
                    <p>LACO AI is an intelligent PDF summarization and analysis system enhanced by Gemeni AI technologies.</p>
                    <p>It is designed to support academic workflows by automatically extracting and condensing essential information from lengthy documents, enabling faster comprehension and improving research efficiency.</p>
                </section>
                <section className={styles.right_side}>
                    
                </section>
            </div>
        </section>
    );

}