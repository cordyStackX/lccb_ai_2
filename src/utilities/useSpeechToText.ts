"use client";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = {
    resultIndex: number;
    results: Array<{ 0?: { transcript?: string } }>;
};

type SpeechRecognitionErrorEventLike = {
    error?: string;
};

type SpeechRecognitionInstance = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window &
    typeof globalThis & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

type SpeechToTextOptions = {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
};

type SpeechToTextResult = {
    isSupported: boolean;
    isListening: boolean;
    transcript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
};

export default function useSpeechToText(options: SpeechToTextOptions = {}): SpeechToTextResult {
        const SpeechRecognition =
                typeof window !== "undefined"
                        ? (window as SpeechRecognitionWindow).SpeechRecognition ||
                            (window as SpeechRecognitionWindow).webkitSpeechRecognition
                        : undefined;

    const isSupported = Boolean(SpeechRecognition);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const requestMicPermission = async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
            return false;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            return true;
        } catch {
            return false;
        }
    };

    const start = () => {
        if (!SpeechRecognition) return;
        if (recognitionRef.current) recognitionRef.current.stop();

        void (async () => {
            const hasPermission = await requestMicPermission();
            if (!hasPermission) {
                setError("mic_permission_denied");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = options.lang ?? "en-US";
            recognition.continuous = options.continuous ?? true;
            recognition.interimResults = options.interimResults ?? true;

            recognition.onresult = (event: SpeechRecognitionEventLike) => {
                let text = "";
                for (let i = 0; i < event.results.length; i++) {
                    text += event.results[i][0]?.transcript ?? "";
                }
                setTranscript(text.trim());
            };

            recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
                setError(event.error || "speech_error");
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            setError(null);
            setIsListening(true);
            recognition.start();
        })();
    };

    const stop = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    return { isSupported, isListening, transcript, error, start, stop };
}
