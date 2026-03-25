"use client";
import { 
	Header,
	Banner,
	Chat_bot,
	Chat_bot_ask,
	Fx_effect
} from "@/components/landpage";
import { useState } from "react";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const router = useRouter();
	const [show, setShow] = useState(false);

	useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (response.success) return router.push("/chat");
        }
        check();
    }, []);

	return (
		<main className="landpage">
			<Header />
			<Banner />
			<Fx_effect />
			<Chat_bot show={show} setShow={setShow} />
			<Chat_bot_ask show={show} setShow={setShow} />
		</main>
	);
}
