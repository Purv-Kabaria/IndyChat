"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, reload } from "firebase/auth";
import { auth, getUserProfile } from "./firebase";

interface UserProfile {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  email_verified?: boolean;
  created_at?:
    | {
        toDate: () => Date;
      }
    | string;
  updated_at?:
    | {
        toDate: () => Date;
      }
    | string;
  [key: string]: unknown;
}

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isEmailVerified: false,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
        setIsEmailVerified(auth.currentUser.emailVerified);
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        await reload(user);
        setIsEmailVerified(user.emailVerified);

        try {
          const profileData = await getUserProfile(user.uid);
          setUserProfile(profileData as UserProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        setIsEmailVerified(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, isEmailVerified, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
