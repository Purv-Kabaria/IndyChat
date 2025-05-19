import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          setProfile(null);
          return;
        }
        
        // Get user data from auth.users
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!userData.user) {
          setProfile(null);
          return;
        }
        
        const user = userData.user;
        
        // Set profile data
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          avatar_url: user.user_metadata?.avatar_url || null,
          address: user.user_metadata?.address || null,
          gender: user.user_metadata?.gender || null,
          tts_enabled: user.user_metadata?.tts_enabled || false,
          stt_enabled: user.user_metadata?.stt_enabled || false,
          voice_id: user.user_metadata?.voice_id || undefined,
        };
        
        setProfile(userProfile);
      } catch (error: unknown) {
        console.error("Error fetching user profile:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchUserProfile();
        } else {
          setProfile(null);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { profile, loading, error };
} 