"use client";
import { 
	Header,
	Banner,
	Content_1,
	Chat_bot,
	// Footer
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
			<Content_1 />
			<Chat_bot show={show} setShow={setShow} />
			<div
				style={{
				display: show ? "block" : "none" ,
				width: "500px",
				height: "98vh",
				position: "fixed",
				bottom: "10px",
				right: "10px",
				zIndex: 9999,
				}}
			>
				<div style={{
					color: "#000",
					position: "absolute",
					top: "10px",
					left: "10px",
					fontWeight: "20px",
					cursor: "pointer",
					fontSize: "21px"
				}} onClick={() => {setShow(false);}}>
					{">"}
				</div>
				<iframe
				src="http://localhost:3000/chat_bot"
				style={{
					width: "100%",
					height: "100%",
					border: "none",
					borderRadius: "12px",
					overflow: "hidden",
					background: "transparent",
				}}
				title="Chat Bot"
				/>
			</div>
			{/* <Footer /> */}
		</main>
	);
}
