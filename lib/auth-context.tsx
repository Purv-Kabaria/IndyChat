'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from './firebase';
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: 'user' | 'admin' | string;
  tts_enabled?: boolean;
  voice_id?: string;
  avatar_url?: string | null;
  created_at?: Timestamp | string | null;
  updated_at?: Timestamp | string | null;
  address?: string | null;
  gender?: string | null;
  stt_enabled?: boolean;
}

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Use UserProfile type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const profileData = await getUserProfile(user.uid);
          setUserProfile(profileData);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 