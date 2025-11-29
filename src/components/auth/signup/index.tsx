import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";
import Link from "next/link";

export default function SignUp() {
    return(
        <section className={`${styles.container} display_flex_center`}>
            <div className="wrapper display_flex_center">
                <form className={styles.form_styles}>
                    <section className={`${styles.info} display_flex_left`}>
                        <figure className={`${styles.logo} display_flex_left`}>
                            <Image 
                            src={image_src.logo1}
                            alt="Logo"
                            width={65}
                            height={65}
                            priority
                            />
                            <figcaption>LACO AI</figcaption>
                        </figure>
                        <h1>Sign up</h1>
                    </section>
                    <input 
                    type="text" 
                    name="email" 
                    id="email" 
                    autoComplete="email"
                    placeholder="Enter Your Email"
                    />
                    <p>Already have an Account? <Link href={"/auth/signin"}>Sign In</Link></p>
                    <section className={`${styles.buttons} display_flex_right`}>
                        <button>Next</button>
                    </section>
                </form>
            </div>
        </section>
    );
}