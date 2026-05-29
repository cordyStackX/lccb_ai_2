import { NextRequest, NextResponse } from "next/server";
import api_links from "@/config/conf/json_config/Api_links.json";
import { supabaseServer } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {
try {
	const rate = rateLimit(req, { windowMs: 1000, max: 5, keyPrefix: "response_image-stream" });
	if (!rate.allowed) {
		const retryAfterSeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
		return NextResponse.json(
			{ success: false, error: "Too many requests. Please try again later." },
			{ status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
		);
	}

	const apikey = process.env.API_KEY;
	if (!apikey) {
		return NextResponse.json({ success: false, error: "API is not Valid" }, { status: 401 });
	}

	const apiUrl = process.env.RENDER_API || api_links.python_links;
	const contentType = req.headers.get("content-type") || "";
	let imageFile: File | null = null;
	let imageUrl: string | null = null;
	let prompt: string | null = null;
	let lastMarkdown: string | null = null;
	let userReply: string | null = null;
	let email: string | null = null;

	if (contentType.includes("application/json")) {
		const body = await req.json();
		imageUrl = typeof body?.image_url === "string" ? body.image_url : null;
		prompt = typeof body?.prompt === "string" ? body.prompt : null;
		lastMarkdown = typeof body?.last_markdown === "string" ? body.last_markdown : null;
		userReply = typeof body?.user_reply === "string" ? body.user_reply : null;
		email = typeof body?.email === "string" ? body.email : null;
	} else {
		const form = await req.formData();
		const image = (form.get("image") || form.get("file")) as unknown;
		prompt = form.get("prompt") as string | null;
		lastMarkdown = form.get("last_markdown") as string | null;
		userReply = form.get("user_reply") as string | null;
		email = form.get("email") as string | null;
		imageFile = image instanceof File ? image : null;
		imageUrl = form.get("image_url") as string | null;
	}

	if (!imageFile && !imageUrl) {
		return NextResponse.json({ success: false, error: "Image file or image_url is required" }, { status: 400 });
	}

	const requestEmail = typeof email === "string" && email ? email : "admin@admin.com";
	const cleanEmail = requestEmail.trim().toLowerCase();
	const bucketName = "image";
	let previewUrl = imageUrl || "";

	if (imageFile) {
		const safeName = imageFile.name ? imageFile.name.replace(/\s+/g, "_") : "upload.jpg";
		const filePath = `uploads/${cleanEmail}_${safeName}`;

		const { error: uploadError } = await supabaseServer.storage
			.from(bucketName)
			.upload(filePath, imageFile, {
				contentType: imageFile.type || "application/octet-stream",
				upsert: true,
			});

		if (uploadError) {
			console.error("Supabase Upload Error: ", uploadError);
			return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
		}

		const { data: publicUrlData } = supabaseServer.storage
			.from(bucketName)
			.getPublicUrl(filePath);

		previewUrl = publicUrlData.publicUrl;
	}

	const { data: existingData, error: queryError } = await supabaseServer
		.from("image_url")
		.select("email")
		.eq("email", cleanEmail)
		.single();

	if (queryError && queryError.code !== "PGRST116") {
		console.error("Supabase Query Error: ", queryError);
		return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
	}

	if (existingData) {
		const { error: updateError } = await supabaseServer
			.from("image_url")
			.update({ image_link: previewUrl })
			.eq("email", cleanEmail);

		if (updateError) {
			console.error("Supabase Update Error: ", updateError);
			return NextResponse.json({ success: false, error: "Failed to save image link" }, { status: 500 });
		}
	} else {
		const { error: insertError } = await supabaseServer
			.from("image_url")
			.insert([{ email: cleanEmail, image_link: previewUrl }]);

		if (insertError) {
			console.error("Supabase Insert Error: ", insertError);
			return NextResponse.json({ success: false, error: "Failed to save image link" }, { status: 500 });
		}
	}

	let upstream: Response;
	if (imageFile) {
		const upstreamForm = new FormData();
		upstreamForm.append("image", imageFile);
		upstreamForm.append("token", apikey);
		if (typeof prompt === "string" && prompt) {
			upstreamForm.append("prompt", prompt);
		}
		if (typeof lastMarkdown === "string" && lastMarkdown) {
			upstreamForm.append("last_markdown", lastMarkdown);
		}
		if (typeof userReply === "string" && userReply) {
			upstreamForm.append("user_reply", userReply);
		}
		if (typeof email === "string" && email) {
			upstreamForm.append("email", email);
		}

		upstream = await fetch(`${apiUrl}generate-md-image`, {
			method: "POST",
			body: upstreamForm,
		});
	} else {
		upstream = await fetch(`${apiUrl}generate-md-image`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				image_url: imageUrl,
				prompt: prompt,
				last_markdown: lastMarkdown,
				user_reply: userReply,
				email,
				token: apikey,
			}),
		});
	}

	if (!upstream.ok) {
		return NextResponse.json(
			{ success: false, error: "Upstream stream error" },
			{ status: upstream.status || 500 }
		);
	}

	const { data: record, error: record_err } = await supabaseServer
		.from("system_logs")
		.select("api_request, created_at")
		.eq("request", requestEmail)
		.gte("created_at", new Date().toISOString().split("T")[0])
		.lt("created_at", new Date(Date.now() + 86400000).toISOString().split("T")[0])
		.maybeSingle();

	if (record_err) {
		console.error("Supabase Query Error: ", record_err);
		return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
	}

	if (record) {
		const record_add = (record.api_request ?? 0) + 1;
		await supabaseServer
			.from("system_logs")
			.update({ api_request: record_add })
			.eq("request", requestEmail);
	}

	if (!record) {
		await supabaseServer
			.from("system_logs")
			.insert([
				{
					request: requestEmail,
					api_request: 1,
				},
			]);
	}

	const upstreamData = await upstream.json().catch(() => null);
	if (!upstreamData?.success) {
		return NextResponse.json(
			{ success: false, error: "Upstream error" },
			{ status: 500 }
		);
	}

	return NextResponse.json({
		success: true,
		preview_url: previewUrl,
		markdown: upstreamData?.markdown || "",
	});
	} catch (error) {
		console.error("response_image-stream POST Error:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}

