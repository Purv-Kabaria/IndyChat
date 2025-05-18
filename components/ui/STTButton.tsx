"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { SpeechRecognitionHandler, isSpeechRecognitionSupported } from "@/functions/sttUtils";

interface STTButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function STTButton({ onTranscript, disabled = false, className = "" }: STTButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionHandler | null>(null);

  // Check browser support on component mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize speech recognition on first use
  const initializeRecognition = () => {
    if (recognitionRef.current) return;

    recognitionRef.current = new SpeechRecognitionHandler(
      // Handle results
      (transcript, isFinal) => {
        if (isFinal) {
          onTranscript(transcript);
          setInterimTranscript("");
        } else {
          setInterimTranscript(transcript);
        }
      },
      // Handle errors
      (error) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
      },
      // Handle state changes
      (listening) => {
        setIsListening(listening);
      }
    );
  };

  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (!recognitionRef.current) {
      initializeRecognition();
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <button
        disabled
        className={`text-xs flex items-center gap-1 text-red-500/70 p-1 rounded-md cursor-not-allowed ${className}`}
        title="Speech recognition is not supported in your browser"
      >
        <AlertCircle className="h-3 w-3" />
        <span>Not supported</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`text-xs flex items-center gap-1 ${
          isListening 
            ? "text-red-500 animate-pulse" 
            : "text-accent/70 hover:text-accent"
        } transition-colors p-1 rounded-md ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="h-3 w-3" />
        ) : (
          <Mic className="h-3 w-3" />
        )}
        <span>
          {isListening ? "Stop" : "Voice"}
        </span>
      </button>
      
      {interimTranscript && isListening && (
        <div className="absolute bottom-full mb-1 left-0 bg-accent/10 text-accent text-xs p-1 rounded min-w-[150px] max-w-[300px]">
          {interimTranscript}...
        </div>
      )}
    </div>
  );
} 