import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";

export interface UserProfile {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  tts_enabled?: boolean;
  voice_id?: string;
  created_at?: FieldValue;
  updated_at?: FieldValue;
  address?: string | null;
  gender?: string | null;
  stt_enabled?: boolean;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const createUser = async (
  email: string,
  password: string,
  userData: Partial<UserProfile>
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await createUserProfile(userCredential.user.uid, {
    ...userData,
    email,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    role: userData.role || "user",
  });

  return userCredential;
};

export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, googleProvider);

  const userExists = await checkUserExists(userCredential.user.uid);

  if (!userExists) {
    const { user } = userCredential;
    await createUserProfile(user.uid, {
      email: user.email,
      first_name: user.displayName?.split(" ")[0] || "",
      last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
      avatar_url: user.photoURL,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      role: "user",
    });
  }

  return userCredential;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);

  try {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch (error) {
    console.error("Error clearing server session:", error);
  }
};

export const createUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const profileData: UserProfile = {
    id: userId,
    email: data.email !== undefined ? data.email : null,
    first_name: data.first_name !== undefined ? data.first_name : "",
    last_name: data.last_name !== undefined ? data.last_name : "",
    avatar_url: data.avatar_url !== undefined ? data.avatar_url : null,
    role: data.role || "user",
    tts_enabled: data.tts_enabled || false,
    voice_id: data.voice_id || "",
    address: data.address !== undefined ? data.address : null,
    gender: data.gender !== undefined ? data.gender : null,
    stt_enabled: data.stt_enabled || false,
    created_at: data.created_at || serverTimestamp(),
    updated_at: data.updated_at || serverTimestamp(),
    ...data,
  };
  await setDoc(userRef, profileData);
};

export const checkUserExists = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
};

export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as UserProfile;
  }

  return null;
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.role === "admin";
};

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const exists = await checkUserExists(user.uid);

        if (!exists) {
          await createUserProfile(user.uid, {
            email: user.email,
            first_name: user.displayName?.split(" ")[0] || "",
            last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
            avatar_url: user.photoURL,
          });
          console.log(`Created new user profile for ${user.email}`);
        }
      } catch (error) {
        console.error("Error ensuring user exists in Firestore:", error);
      }
    }
  });
}

export { app, auth, db };
