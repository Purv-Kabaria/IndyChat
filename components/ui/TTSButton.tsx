"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { UserProfile } from "@/hooks/useUserProfile";
import { playTextToSpeech } from "@/functions/ttsUtils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface TTSButtonProps {
  text: string;
  profile: UserProfile | null;
  isLoading?: boolean;
  isLastMessage?: boolean;
}

export function TTSButton({ text, profile, isLoading = false, isLastMessage = false }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopFunctionRef = useRef<(() => void) | null>(null);

  const handleTTS = async () => {
    if (isPlaying) {
      // Stop playback if already playing
      if (stopFunctionRef.current) {
        stopFunctionRef.current();
        stopFunctionRef.current = null;
      }
      return;
    }

    // Check if TTS is enabled in the user's profile
    if (!profile?.tts_enabled) {
      // Alert the user that TTS is not enabled
      const enableTTS = confirm("Text-to-speech is not enabled in your profile. Would you like to enable it now?");
      
      if (enableTTS) {
        try {
          // Create Supabase client
          const supabase = createClientComponentClient();
          
          // Update user metadata
          await supabase.auth.updateUser({
            data: {
              tts_enabled: true,
            },
          });
          
          alert("Text-to-speech has been enabled. You can now listen to messages.");
          // Continue with TTS after enabling
        } catch (error) {
          console.error('Error updating TTS setting:', error);
          alert('Failed to enable text-to-speech. Please try again or update your settings in the profile page.');
          return;
        }
      } else {
        // User declined to enable TTS
        return;
      }
    }

    try {
      const { audio, stop } = await playTextToSpeech(
        text,
        profile,
        () => setIsTtsLoading(true),
        () => {
          setIsPlaying(false);
          setIsTtsLoading(false);
          audioRef.current = null;
          stopFunctionRef.current = null;
        },
        (error) => {
          setIsPlaying(false);
          setIsTtsLoading(false);
          audioRef.current = null;
          stopFunctionRef.current = null;
          alert(error.message || 'An error occurred while processing your request. Please try again.');
        }
      );

      if (audio) {
        audioRef.current = audio;
        stopFunctionRef.current = stop;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error with TTS button:', error);
    }
  };

  // Show loading dots when message is being generated and it's the last message
  if (isLoading && isLastMessage) {
    return (
      <div className="flex space-x-1">
        <div className="h-1 w-1 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-1 w-1 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
        <div className="h-1 w-1 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
      </div>
    );
  }

  // Show listen/stop button when message is complete
  return (
    <button
      onClick={handleTTS}
      disabled={isTtsLoading}
      className="text-xs flex items-center gap-1 text-accent/70 hover:text-accent transition-colors p-1 rounded-md"
      title={isPlaying ? "Stop speaking" : "Listen to this message"}
    >
      {isTtsLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      <span>
        {isTtsLoading 
          ? "Loading..." 
          : isPlaying 
            ? "Stop" 
            : "Listen"}
      </span>
    </button>
  );
} 