// This file contains the startRecording function which handles audio recording logic.
import { SweetAlert2 } from "@/utilities";
import api_link from "@/config/conf/json_config/fetch_url.json";

type SetChatresType = (v: { ask: string; respond2: string }) => void;
type SetMessagesType = (updater: (prev: { ask: string; respond: string }[]) => { ask: string; respond: string }[]) => void;
type StreamVoiceToTextType = (opts: {
	apiUrl: string;
	audioBlob: Blob;
	email: string;
	pdfId?: number;
	fName: string;
	lastUserResponse: string;
	lastAiResponse: string;
	onPrompt: (prompt: string) => void;
	onText: (text: string) => void;
	onError: (message: string) => void;
	onDone: () => void;
}) => void;


type RecordingOptions = {
	isMediaSupported: boolean;
	loading: boolean;
	email: string;
	pdf_id?: number;
	f_name: string;
	setStatus: (v: boolean) => void;
	setLoading: (v: boolean) => void;
	setFx_effects: (v: boolean) => void;
	setFx_effects2: (v: boolean) => void;
	setVoiceStatus: (s: string) => void;
	mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
	audioChunksRef: React.MutableRefObject<Blob[]>;
	voiceResponseRef: React.MutableRefObject<string>;
	voiceAutoPlayRef: React.MutableRefObject<boolean>;
	recordingTimeoutRef: React.MutableRefObject<number | null>;
	setChatres: SetChatresType;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	setMessages: SetMessagesType;
	voiceMessageIndexRef: React.MutableRefObject<number | null>;
	messages: { ask: string; respond: string }[];
	streamVoiceToText: StreamVoiceToTextType;
	playTts: (text: string, onComplete?: () => void) => Promise<void>;
	setIsRecording: (b: boolean) => void;
};

export default async function startRecording(opts: RecordingOptions) {
	const {
	isMediaSupported,
	loading,
	email,
	pdf_id,
	f_name,
	setStatus,
	setLoading,
	setFx_effects,
	setFx_effects2,
	setVoiceStatus,
	mediaRecorderRef,
	audioChunksRef,
	voiceResponseRef,
	voiceAutoPlayRef,
	recordingTimeoutRef,
	setChatres,
	textareaRef,
	setMessages,
	voiceMessageIndexRef,
	messages,
	streamVoiceToText,
	playTts,
	setIsRecording,
	} = opts;

	if (!isMediaSupported) return alert("Browser Media is not supported :(");
	if (loading) return;
	if (!email || !pdf_id || !f_name) {
		SweetAlert2(
			"Missing context",
			"Upload a PDF and make sure your account is loaded before using voice input.",
			"warning",
			true,
			"OK",
			false,
			"",
			false
		);
		return;
	}

	setStatus(true);
	setLoading(true);
	setFx_effects(true);
	setFx_effects2(true);

	setVoiceStatus("Recording your Voice");

	try {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const recorder = new MediaRecorder(stream);
	audioChunksRef.current = [];
	voiceResponseRef.current = "";
	voiceAutoPlayRef.current = true;

	recorder.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				audioChunksRef.current.push(event.data);
			}
		};

		recorder.onstop = () => {
			if (recordingTimeoutRef.current) {
				clearTimeout(recordingTimeoutRef.current);
				recordingTimeoutRef.current = null;
			}
			stream.getTracks().forEach((track) => track.stop());
			const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
			if (audioBlob.size === 0) return;

			setStatus(true);
			setLoading(true);
			setChatres({ ask: "", respond2: "" });
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}

			setMessages((prev) => {
				const next = [...prev, { ask: "Transcribing audio...", respond: "" }];
				voiceMessageIndexRef.current = next.length - 1;
				return next;
			});

			const lastMessage = messages[messages.length - 1];
			const lastUserResponse = lastMessage?.ask || "";
			const lastAIResponse = lastMessage?.respond || "";

			setVoiceStatus("Transcribing Response");

			streamVoiceToText({
				apiUrl: api_link.voice_stream,
				audioBlob,
				email,
				pdfId: pdf_id,
				fName: f_name,
				lastUserResponse,
				lastAiResponse: lastAIResponse,
				onPrompt: (prompt: string) => {
					voiceResponseRef.current = "";
					setMessages((prev) => {
						const updated = [...prev];
						const index = voiceMessageIndexRef.current;
						if (index === null || index >= updated.length) {
							updated.push({ ask: `Transcription: ${prompt}`, respond: "" });
							voiceMessageIndexRef.current = updated.length - 1;
							return updated;
						}
						updated[index] = { ...updated[index], ask: `Transcription: ${prompt}` };
						return updated;
					});
				},
				onText: (text: string) => {
					voiceResponseRef.current += text;

					setVoiceStatus("Generating LLM text Responses");
					setMessages((prev) => {
						const updated = [...prev];
						const index = voiceMessageIndexRef.current;
						if (index === null || index >= updated.length) {
							voiceMessageIndexRef.current = updated.length - 1;
							return updated;
						}
						const current = updated[index];
						updated[index] = {
							...current,
							respond: `${current.respond}${text}`,
						};
						return updated;
					});
				},
				onError: (message: string) => {
					setVoiceStatus("Something Went Wrong");

					setFx_effects(false);
					setFx_effects2(false);

					setMessages((prev) => {
						const updated = [...prev];
						const index = voiceMessageIndexRef.current;
						if (index === null || index >= updated.length) {
							voiceMessageIndexRef.current = updated.length - 1;
							return updated;
						}
						updated[index] = {
							...updated[index],
							respond: message + " 🤖 Voice API is temporarily suspended for maintenance ⚠️",
						};
						return updated;
					});
					setLoading(false);
					voiceMessageIndexRef.current = null;
				},
				onDone: () => {
					voiceMessageIndexRef.current = null;
					if (voiceAutoPlayRef.current) {
						setVoiceStatus("Generating TSS Voice Responses");
						void playTts(voiceResponseRef.current, () => {
							setLoading(false);
							setFx_effects(false);
						});
					} else {
						setLoading(false);
					}
					voiceAutoPlayRef.current = false;
				},
			});
		};

	mediaRecorderRef.current = recorder;
	recorder.start();
		try {
			recordingTimeoutRef.current = window.setTimeout(() => {
				if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
					mediaRecorderRef.current.stop();
					setIsRecording(false);
				}
			}, 10000);
		} catch (e) {
			// ignore in non-browser environments
			console.log("Error: ", e);
		}
		setIsRecording(true);
	} catch (err) {
		console.error("startRecording error:", err);
		setLoading(false);
		setFx_effects(false);
		setFx_effects2(false);
	}
}

