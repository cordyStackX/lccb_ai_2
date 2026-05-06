export async function fetchTtsUrl(apiUrl: string, text: string, voice = "alloy") {
  const cleaned = String(text || "").trim();
  if (!cleaned) return null;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned, voice }),
    });

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    return url;
  } catch {
    return null;
  }
}

export function playUrl(
  url: string | null,
  ttsAudioRef: { current: HTMLAudioElement | null },
  setTtsReplayUrl: (u: string | null) => void,
  setTtsReplayIndex: (i: number | null) => void,
  voiceMessageIndexRef: { current: number | null }
) {
  if (!url) return;

  try {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      try {
        URL.revokeObjectURL(ttsAudioRef.current.src);
      } catch {
        // ignore cleanup errors
      }
    }

    const audio = new Audio(url);
    ttsAudioRef.current = audio;
    setTtsReplayUrl(url);
    setTtsReplayIndex(voiceMessageIndexRef.current);

    audio.onended = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup errors
      }
    };
    audio.onerror = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup errors
      }
    };

    void audio.play();
  } catch {
    // ignore audio play errors
  }
}

export function replayUrl(
  url: string | null,
  ttsAudioRef: { current: HTMLAudioElement | null }
) {
  if (!url) return;
  if (ttsAudioRef.current) {
    ttsAudioRef.current.pause();
  }
  const audio = new Audio(url);
  ttsAudioRef.current = audio;
  void audio.play();
}
