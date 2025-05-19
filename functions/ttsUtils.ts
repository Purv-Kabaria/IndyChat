import { UserProfile } from "@/hooks/useUserProfile";

export const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

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

export const playTextToSpeech = async (
  text: string, 
  profile: UserProfile | null,
  onStart: () => void,
  onComplete: () => void,
  onError: (error: any) => void
): Promise<{ audio: HTMLAudioElement | null; stop: () => void }> => {
  try {
    onStart();
    
    const cleanText = cleanTextForTTS(text);
    
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
        voiceId: DEFAULT_VOICE_ID
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TTS API error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please refresh the page to continue using text-to-speech.');
      } else if (response.status === 403) {
        throw new Error('Text-to-speech is not enabled for your account. Please enable it in your profile settings.');
      } else {
        throw new Error('Failed to generate speech. Please try again later.');
      }
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      onComplete();
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      URL.revokeObjectURL(audioUrl);
      onError(new Error('Error playing audio. Please try again.'));
    };
    
    try {
      await audio.play();
    } catch (playError) {
      console.error('Audio play error:', playError);
      URL.revokeObjectURL(audioUrl);
      throw new Error('Could not play audio. Please try again or check your browser settings.');
    }
    
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

export const testTextToSpeech = async (): Promise<void> => {
  const testText = "This is a test of the ElevenLabs text-to-speech feature. Your voice settings are working correctly.";
  
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
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const audio = new Audio(audioUrl);
  await audio.play();
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
}; 