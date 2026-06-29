import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface SpeechResult {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export default function useSpeechRecognition(
  onResult: (text: string) => void,
): SpeechResult {

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");           
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const isSupported = !!SpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);

      if (transcriptRef.current.trim()) {
        onResult(transcriptRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setError(event.error);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      transcriptRef.current = currentTranscript;
      setTranscript(currentTranscript);
      onResult(currentTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [SpeechRecognition, onResult]);

  const startListening = () => {
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  };
}