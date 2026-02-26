"use client";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";

export default function Under_Dev() {
    const router = useRouter();

    return(
        <section style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexFlow: "column" }}>
            <img src="/face.png" alt="cordystackx" width={200} height={200} />
            <h1 style={{ color: "blue" }}> {"<---"} Under Development {"--->"}</h1>
            <a href="https://github.com/cordyStackX/lccb_ai_2/issues" 
            style={{ color: "green", fontWeight: "bolder", cursor: "pointer" }}
            >Check the Github Repo</a>
            <a onClick={async () => {
                await Fetch_to(api_link.jwt.deauth);
                router.push("/");
            }} style={{ color: "red", fontWeight: "bolder", cursor: "pointer" }}> Log Out </a>
        </section>
    );

}