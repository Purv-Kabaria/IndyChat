import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

interface RateLimitEntry {
  count: number;
  timestamp: number;
}
const rateLimitCache: Record<string, RateLimitEntry> = {};
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 5;

interface UserData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

interface UserProfile {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  email_verified?: boolean;
  created_at?: {
    toDate: () => Date;
  } | string;
  updated_at?: {
    toDate: () => Date;
  } | string;
  [key: string]: unknown;
}

const handleFirebaseError = (error: unknown, context: string) => {
  console.error(`Firebase ${context} error:`, error);

  const errorCode = (error as { code?: string })?.code || "unknown";
  const errorMessage = (error as Error)?.message || `An error occurred during ${context}`;

  if (process.env.NODE_ENV === "production") {
  }

  return {
    code: errorCode,
    message: errorMessage,
    originalError: error,
  };
};

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const entry = rateLimitCache[key];

  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitCache[key] = { count: 1, timestamp: now };
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    console.error("Firebase persistence error:", err.code);
  });
}

export const createUser = async (
  email: string,
  password: string,
  userData: UserData
): Promise<{ user: User | null; error: { code: string; message: string; originalError: unknown } | null }> => {
  try {
    const ipAddress = "client";
    if (!checkRateLimit(`createUser_${ipAddress}`)) {
      throw new Error(
        "Too many account creation attempts. Please try again later."
      );
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await sendEmailVerification(userCredential.user, {
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?email=${encodeURIComponent(email)}`,
      handleCodeInApp: false,
    });

    await createUserProfile(userCredential.user.uid, {
      ...userData,
      email,
      email_verified: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await signOut(auth);

    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    return { user: null, error: handleFirebaseError(error, "user creation") };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: { code: string; message: string; originalError: unknown } | null }> => {
  try {
    const ipAddress = "client";
    if (!checkRateLimit(`signIn_${ipAddress}`)) {
      throw new Error("Too many sign-in attempts. Please try again later.");
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      // If not verified, send a new verification email
      await sendEmailVerification(userCredential.user, {
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false,
      });
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: handleFirebaseError(error, "sign in") };
  }
};

export const signInWithGoogle = async (): Promise<{
  user: User | null;
  error: { code: string; message: string; originalError: unknown } | null;
}> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);

    const userExists = await checkUserExists(userCredential.user.uid);

    if (!userExists) {
      const { user } = userCredential;
      await createUserProfile(user.uid, {
        email: user.email,
        email_verified: user.emailVerified,
        first_name: user.displayName?.split(" ")[0] || "",
        last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
        avatar_url: user.photoURL,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: handleFirebaseError(error, "Google sign in") };
  }
};

export const logOut = async (): Promise<{
  success: boolean;
  error: { code: string; message: string; originalError: unknown } | null;
}> => {
  try {
    await signOut(auth);

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Error clearing server session:", error);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: handleFirebaseError(error, "sign out") };
  }
};

export const createUserProfile = async (
  userId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error: { code: string; message: string; originalError: unknown } | null }> => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...data,
      id: userId,
      role: "user",
    });
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: handleFirebaseError(error, "profile creation"),
    };
  }
};

export const checkUserExists = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error) {
    handleFirebaseError(error, "profile retrieval");
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error: { code: string; message: string; originalError: unknown } | null }> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: handleFirebaseError(error, "profile update"),
    };
  }
};

export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const sendPasswordReset = async (
  email: string
): Promise<{ success: boolean; error: { code: string; message: string; originalError: unknown } | null }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: handleFirebaseError(error, "password reset"),
    };
  }
};

export const goOffline = async (): Promise<void> => {
  await disableNetwork(db);
};

export const goOnline = async (): Promise<void> => {
  await enableNetwork(db);
};

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const exists = await checkUserExists(user.uid);

        if (!exists) {
          await createUserProfile(user.uid, {
            email: user.email,
            email_verified: user.emailVerified,
            first_name: user.displayName?.split(" ")[0] || "",
            last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
            avatar_url: user.photoURL,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Error ensuring user exists in Firestore:", error);
      }
    }
  });
}

export { app, auth, db, storage };
