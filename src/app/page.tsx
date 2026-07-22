"use client";
import { 
	Header,
	Banner,
	Content_1,
	Content_2,
	Content_3,
	Content_4,
	Chat_bot,
	Footer
} from "@/components/landpage";
import { useState } from "react";
import { Fetch_to } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";
import fetch_link from "@/config/conf/json_config/Api_links.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const router = useRouter();
	const [show, setShow] = useState(false);

	useEffect(() => {
        async function check() {
            const response = await Fetch_to(api_link.jwt.verify);
            if (response.success) {
				if (response.data.message.final_data.data[0].role === "admin") return router.push("/admin/dashboard");
				if (response.data.message.final_data.data[0].role === "Business") return router.push("/admin_business/dashboard");
				return router.push("/chat");
			}
        }
        check();
    }, []);

	return (
		<main className="landpage">
			<Header />
			<Banner />
			<Content_1 />
			<Content_2 />
			<Content_3 />
			<Content_4 />
			<Chat_bot show={show} setShow={setShow} />
			<div
				style={{
				display: show ? "block" : "none" ,
				width: "min(500px, 95%)",
				height: "95vh",
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
				src={process.env.NEXT_PUBLIC_CHATBOTURL || fetch_link.iframe_localhost}
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
			<Footer />
		</main>
	);
}
