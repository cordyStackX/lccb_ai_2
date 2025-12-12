export default async function Fetch_to(
	dir: string,
	payload: Record<string, unknown> = {},
	headers: Record<string, string> = { "x-api-key": process.env.API_KEY || "" },
	retries: number = 3,      // number of attempts
	delay: number = 1000      // wait time between attempts in ms
	) {
	if (!dir || dir === "") {
		if (typeof window !== "undefined") alert("Invalid API Directory not found");
		return { success: false, message: "Invalid API Directory" };
	}

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
		const response = await fetch(dir, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...headers },
			body: JSON.stringify(payload),
		});

		const data = await response.json().catch(() => null); // safe parse

		if (response.ok) {
			console.log("Status for fetch: ", data);
			return { success: true, data }; // success
		} else {
			console.log(data?.error);
			return { success: false, message: data?.error || `Request failed: ${response.status}` };
		}
		} catch (err: unknown) {
		let message = "Unknown fetch error";
		if (err instanceof Error) message = err.message;
		console.error(`Attempt ${attempt} fetch error:`, message);
		}

		if (attempt < retries) await new Promise(res => setTimeout(res, delay));
	}

		return { success: false, message: `All ${retries} attempts failed for ${dir}` };
}
