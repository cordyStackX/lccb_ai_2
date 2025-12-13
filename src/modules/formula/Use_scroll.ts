
import { useEffect, useState } from "react";

export default function UseScroll() {
    const [ y, setY ] = useState("");

    useEffect(() => {
        const handle = () => setY(window.scrollY.toString());
        window.addEventListener("scroll", handle);
        return () => window.removeEventListener("scroll", handle);
    }, []);

    return y;

}