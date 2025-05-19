import { UserProfile } from "@/hooks/useUserProfile";

// Export the default voice ID so it can be used across the application
export const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

/**
 * Clean text for TTS by removing markdown and code blocks
 */
export const cleanTextForTTS = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`[\s\S]*?`/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\n\n/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Play text using TTS API
 */
export const playTextToSpeech = async (
  text: string, 
  profile: UserProfile | null,
  onStart: () => void,
  onComplete: () => void,
  onError: (error: any) => void
): Promise<{ audio: HTMLAudioElement | null; stop: () => void }> => {
  // We'll still proceed with TTS even if profile is null or TTS is not enabled
  // as the TTSButton component will handle the profile checking now
  
  try {
    onStart();
    
    // Clean text for TTS
    const cleanText = cleanTextForTTS(text);
    
    // Don't send TTS request if message is too short or empty after cleaning
    if (cleanText.length < 5) {
      onComplete();
      return { audio: null, stop: () => {} };
    }
    
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: cleanText,
        // Always use Adam voice
        voiceId: DEFAULT_VOICE_ID
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TTS API error:', errorData);
      
      if (response.status === 401) {
        // Handle unauthorized error - likely session expired
        throw new Error('Your session has expired. Please refresh the page to continue using text-to-speech.');
      } else if (response.status === 403) {
        // Handle forbidden error - TTS not enabled
        throw new Error('Text-to-speech is not enabled for your account. Please enable it in your profile settings.');
      } else {
        // Handle other errors
        throw new Error('Failed to generate speech. Please try again later.');
      }
    }
    
    // Get the audio blob from the response
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Play the audio
    const audio = new Audio(audioUrl);
    
    // Set up event handlers
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Clean up
      onComplete();
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      URL.revokeObjectURL(audioUrl); // Clean up
      onError(new Error('Error playing audio. Please try again.'));
    };
    
    try {
      await audio.play();
    } catch (playError) {
      console.error('Audio play error:', playError);
      URL.revokeObjectURL(audioUrl);
      throw new Error('Could not play audio. Please try again or check your browser settings.');
    }
    
    // Return the audio element and a function to stop it
    return {
      audio,
      stop: () => {
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        onComplete();
      }
    };
  } catch (error) {
    console.error('Error with text-to-speech:', error);
    onError(error);
    return { audio: null, stop: () => {} };
  }
};

/**
 * Test TTS functionality with a sample message
 */
export const testTextToSpeech = async (): Promise<void> => {
  // Sample text to test TTS
  const testText = "This is a test of the ElevenLabs text-to-speech feature. Your voice settings are working correctly.";
  
  // Call the ElevenLabs API through your backend
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      text: testText,
      voiceId: DEFAULT_VOICE_ID
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }
  
  // Get the audio blob from the response
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Play the audio
  const audio = new Audio(audioUrl);
  await audio.play();
  
  // Clean up when done
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
}; 