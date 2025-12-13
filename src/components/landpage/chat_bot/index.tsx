import styles from "./css/styles.module.css";
import Image from "next/image";
import image_src from "@/config/images_links/assets.json";

interface Chat_botProps {
    show: boolean;
    setShow: (val: boolean) => void;
}

export default function Chat_bot({ show, setShow } : Chat_botProps) {

    return(
        <section 
        className={`${styles.container} display_flex_center`}  
        onClick={() => {setShow(!show);}}
        >
            <p>Ask Chat bot ?</p>
            <Image 
            src={image_src.plushie}
            alt="plushie"
            width={35}
            height={40}
            className={styles.plushie}
            />
        </section>
    );
}