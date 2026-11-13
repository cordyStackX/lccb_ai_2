
export default async function streamVoiceToText({
  apiUrl,
  audioBlob,
  language,
  email,
  pdfId,
  fName,
  lastUserResponse,
  lastAiResponse,
  onText,
  onPrompt,
  onDone,
  onError,
}: {
  apiUrl: string;
  audioBlob: Blob;
  language?: string;
  email?: string;
  pdfId?: number;
  fName?: string;
  lastUserResponse?: string;
  lastAiResponse?: string;
  onText: (text: string) => void;
  onPrompt?: (prompt: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}) {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  if (language) form.append("language", language);
  if (email) form.append("email", email);
  if (typeof pdfId === "number") form.append("pdf_id", String(pdfId));
  if (fName) form.append("f_name", fName);
  if (lastUserResponse) form.append("last_user_response", lastUserResponse);
  if (lastAiResponse) form.append("last_ai_response", lastAiResponse);

  const res = await fetch(apiUrl, {
    method: "POST",
    body: form,
  });

  if (!res.ok || !res.body) {
    onError?.("Stream request failed");
    return;
  }

  const reader = res.body.getReader();
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

      let payload: { text?: string; prompt?: string; done?: boolean; error?: string } | null = null;
      try {
        payload = JSON.parse(payloadText);
      } catch {
        payload = null;
      }

      if (!payload) continue;
      if (payload.error) onError?.(payload.error);
      if (payload.prompt) onPrompt?.(payload.prompt);
      if (payload.text) onText(payload.text);
      if (payload.done) onDone?.();
    }
  }
}