import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
} from "firebase/auth";
import { auth, getUserProfile } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  isEmailVerified: boolean;
  refreshUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserEmail: (newEmail: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Function to refresh the user and check email verification status
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
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Make sure we have the latest email verification status
        try {
          await reload(authUser);
          setIsEmailVerified(authUser.emailVerified);
        } catch (error) {
          console.error("Error reloading user:", error);
        }

        try {
          const profile = await getUserProfile(authUser.uid);
          setUserProfile(profile);
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

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await sendEmailVerification(auth.currentUser);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updatePassword(auth.currentUser, newPassword);
  };

  const updateUserEmail = async (newEmail: string, password: string) => {
    if (!auth.currentUser || !auth.currentUser.email)
      throw new Error("No authenticated user with email");

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updateEmail(auth.currentUser, newEmail);
  };

  const value = {
    user,
    userProfile,
    loading,
    isEmailVerified,
    refreshUser,
    sendVerificationEmail,
    resetPassword,
    updateUserPassword,
    updateUserEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
