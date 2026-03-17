import React, { useEffect, useRef } from 'react';

interface VoiceRecognizerProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
}

export const VoiceRecognizer: React.FC<VoiceRecognizerProps> = ({ onTranscript, isListening }) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition no está soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-HN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Error recognizing speech", event.error);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Puede que ya esté escuchando
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className="flex justify-center items-center py-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full shadow-lg animate-pulse text-white">
        <span className="text-xl">🎙️</span>
        <span className="text-sm font-semibold">Escuchando comando...</span>
      </div>
    </div>
  );
};
