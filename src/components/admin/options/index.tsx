import styles from "./css/styles.module.css";

export default function Options() {
    return(
        <section className={styles.container}>
            <figure>
                

            </figure>
            <section className={styles.options}>
                <button>Dashboard</button>
                <button>Manage User</button>
            </section>
        </section>
    );
}