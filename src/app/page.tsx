"use client";
import { 
	Header,
	Banner,
	Chat_bot,
	Chat_bot_ask
} from "@/components/landpage";
import { useState } from "react";

export default function Home() {
	const [show, setShow] = useState(false);

	return (
		<main className="landpage">
			<Header />
			<Banner />
			<Chat_bot show={show} setShow={setShow} />
			<Chat_bot_ask show={show} setShow={setShow} />
		</main>
	);
}
