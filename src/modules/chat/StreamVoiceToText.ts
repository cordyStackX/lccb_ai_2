
export default async function streamVoiceToText({
  apiUrl,
  audioBlob,
  language,
  onText,
  onDone,
  onError,
}: {
  apiUrl: string;
  audioBlob: Blob;
  language?: string;
  onText: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}) {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  if (language) form.append("language", language);

  const res = await fetch(`${apiUrl}generate-voice-md-stream`, {
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

      let payload: { text?: string; done?: boolean; error?: string } | null = null;
      try {
        payload = JSON.parse(payloadText);
      } catch {
        payload = null;
      }

      if (!payload) continue;
      if (payload.error) onError?.(payload.error);
      if (payload.text) onText(payload.text);
      if (payload.done) onDone?.();
    }
  }
}