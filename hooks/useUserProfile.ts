import { useState, useEffect } from 'react';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  address: string | null;
  gender: string | null;
  tts_enabled?: boolean;
  stt_enabled?: boolean;
  voice_id?: string;
  role?: string;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      try {
        const userData = await getUserProfile(userId);

        if (!userData) {
          setProfile(null);
          return;
        }

        // Set profile data
        const userProfile: UserProfile = {
          id: userId,
          email: userData.email || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          avatar_url: userData.avatar_url || null,
          address: userData.address || null,
          gender: userData.gender || null,
          tts_enabled: userData.tts_enabled || false,
          stt_enabled: userData.stt_enabled || false,
          voice_id: userData.voice_id || undefined,
          role: userData.role || "user",
        };
        
        setProfile(userProfile);
      } catch (error: unknown) {
        console.error("Error fetching user profile:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return { profile, loading, error };
} 