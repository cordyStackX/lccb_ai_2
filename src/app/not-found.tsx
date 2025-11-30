import styling from "./not-found.module.css";
import Link from "next/link";

export default function NotFound() {

    return(
        <div className={styling.container}>
            <img 
            src="/Error.gif" 
            alt="Error"
            width={200} 
            height={220} 
            style={{ imageRendering: "crisp-edges" }}
            />
            <h2>🚧Not Found🚧</h2>
            <Link href="/">Go Back to LandPage {'>>'}</Link>
        </div>
    );
}