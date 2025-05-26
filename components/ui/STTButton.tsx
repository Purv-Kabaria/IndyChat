"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { SpeechRecognitionHandler, isSpeechRecognitionSupported } from "@/functions/sttUtils";
import { UserProfile } from "@/hooks/useUserProfile";

interface STTButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  profile: UserProfile | null;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
}

export function STTButton({
  onTranscript,
  disabled = false,
  className = "",
  profile,
  isRecording,
  setIsRecording,
}: STTButtonProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionHandler | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (profile && !profile.stt_enabled && isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  }, [profile, isRecording, setIsRecording]);

  const initializeRecognition = () => {
    if (recognitionRef.current || !profile || !profile.stt_enabled) return;

    recognitionRef.current = new SpeechRecognitionHandler(
      (transcript, isFinal) => {
        if (isFinal) {
          onTranscript(transcript);
          setInterimTranscript("");
        } else {
          setInterimTranscript(transcript);
        }
      },
      (error) => {
        console.error("Speech recognition error:", error);
        setIsRecording(false);
      },
      (listening) => {
        setIsRecording(listening);
      }
    );
  };

  const toggleListening = () => {
    if (!isSupported || disabled || !profile || !profile.stt_enabled) return;

    if (!recognitionRef.current) {
      initializeRecognition();
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!profile || !profile.stt_enabled) {
    return (
      <button
        type="button"
        disabled
        className={`p-2 rounded-md text-muted-foreground/70 cursor-not-allowed flex items-center justify-center ${className}`}
        title="Voice input is disabled in your profile settings."
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }
  
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`p-2 rounded-md text-red-500/70 cursor-not-allowed flex items-center justify-center ${className}`}
        title="Speech recognition is not supported in your browser"
      >
        <AlertCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2 rounded-md transition-colors flex items-center justify-center 
          ${isRecording 
            ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 animate-pulse" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent hover:text-white"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
          ${className}`}
        title={isRecording ? "Stop listening" : "Start voice input"}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
      
      {interimTranscript && isRecording && (
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg min-w-[150px] max-w-[300px] border border-border">
          {interimTranscript}...
        </div>
      )}
    </div>
  );
} 