import { useState, useEffect } from "react";
import { auth, getUserProfile } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

        const userProfile: UserProfile = {
          id: userId,
          email: userData.email || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          avatar_url: typeof userData.avatar_url === 'string' ? userData.avatar_url : null,
          address: typeof userData.address === 'string' ? userData.address : null,
          gender: typeof userData.gender === 'string' ? userData.gender : null,
          tts_enabled: Boolean(userData.tts_enabled),
          stt_enabled: Boolean(userData.stt_enabled),
          voice_id: typeof userData.voice_id === 'string' ? userData.voice_id : undefined,
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
