import styles from "./css/styles.module.css";


export default function ManageUser() {

    return(
        <section className={styles.container}>
            <section className={styles.search}>
                <input 
                type="text"
                name="search"
                id="search"
                placeholder="Search "
                />
            </section>
            <table className={styles.tables}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Gmail</th>
                        <th>Created_at</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Marc Giestin Louis Cordova</td>
                        <td>3 year</td>
                        <td>cordovamarcgiestinlouis@gmail.com</td>
                        <td>2025-12-08 17:07:09.234131+00</td>
                        <td>
                            <select>
                                <option value="active">Active 🟢</option>
                                <option value="suspended">Suspend 🟡</option>
                                <option value="delete">Delete 🔴</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    );

}

