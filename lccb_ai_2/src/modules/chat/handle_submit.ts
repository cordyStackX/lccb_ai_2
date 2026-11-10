import type React from "react";

type Message = { ask: string; respond: string };

type HandleSubmitArgs = {
	event?: React.FormEvent<HTMLFormElement>;
	chatInput: string;
	setChatres: React.Dispatch<React.SetStateAction<{ ask: string; respond2: string }>>;
	setStatus: React.Dispatch<React.SetStateAction<boolean>>;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setStreamFadeMs: React.Dispatch<React.SetStateAction<number>>;
	setStreamTick: React.Dispatch<React.SetStateAction<number>>;
	lastChunkAtRef: React.MutableRefObject<number | null>;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	apiUrl: string;
	payloadBase: {
		email: string;
		pdf_id: number | undefined;
		f_name: string;
	};
	messages: Message[];
};

export default async function handleChatSubmit({
	event,
	chatInput,
	setChatres,
	setStatus,
	setLoading,
	setMessages,
	setStreamFadeMs,
	setStreamTick,
	lastChunkAtRef,
	textareaRef,
	apiUrl,
	payloadBase,
	messages,
}: HandleSubmitArgs) {
	event?.preventDefault();
	if (!chatInput.trim()) return;

	setStatus(true);
	setLoading(true);

	const userMessage = { ask: chatInput, respond: "" };
	setMessages((prev) => [...prev, userMessage]);

	const prompt = chatInput;
	setChatres({ ask: "", respond2: "" });
	if (textareaRef.current) {
		textareaRef.current.style.height = "auto";
	}

	const lastMessage = messages[messages.length - 1];
	const lastUserResponse = lastMessage?.ask || "";
	const lastAIResponse = lastMessage?.respond || "";

	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: prompt,
				email: payloadBase.email,
				pdf_id: payloadBase.pdf_id,
				f_name: payloadBase.f_name,
				last_user_response: lastUserResponse,
				last_ai_response: lastAIResponse,
			}),
		});

		if (!response.ok || !response.body) {
			const errorData = await response.json().catch(() => null);
			throw new Error(errorData?.error || "Stream request failed");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const parts = buffer.split("\n\n");
			buffer = parts.pop() || "";

			for (const part of parts) {
				if (!part.startsWith("data:")) continue;
				const payloadText = part.replace(/^data:\s?/, "").trim();

				let payload: { text?: string; done?: boolean; error?: string } | null = null;
				try {
					payload = JSON.parse(payloadText);
				} catch {
					payload = null;
				}

				if (!payload) continue;

				if (payload.error) {
					throw new Error(payload.error);
				}

				if (payload.done) {
					break;
				}

				if (payload.text) {
					const now = Date.now();
					const lastAt = lastChunkAtRef.current ?? now;
					const gap = now - lastAt;
					lastChunkAtRef.current = now;

					const base = 80 + payload.text.length * 4 + gap * 0.1;
					const clamped = Math.min(260, Math.max(80, base));
					setStreamFadeMs(Math.round(clamped));
					setStreamTick((prev) => prev + 1);

					setMessages((prev) => {
						const updated = [...prev];
						const lastIndex = updated.length - 1;
						const lastItem = updated[lastIndex];
						updated[lastIndex] = {
							...lastItem,
							respond: `${lastItem.respond}${payload?.text || ""}`,
						};
						return updated;
					});
				}
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Streaming failed";
		setMessages((prev) => {
			const updated = [...prev];
			updated[updated.length - 1] = {
				ask: prompt,
				respond: message,
			};
			return updated;
		});
	} finally {
		setLoading(false);
		lastChunkAtRef.current = null;
	}
}
