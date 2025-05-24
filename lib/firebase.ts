import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  getIdTokenResult,
  onAuthStateChanged,
  User
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

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
  userData: any
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
  
  // Check if this user already exists in our Firestore database
  const userExists = await checkUserExists(userCredential.user.uid);
  
  // If the user doesn't exist in Firestore, create a profile
  if (!userExists) {
    const { user } = userCredential;
    await createUserProfile(user.uid, {
      email: user.email,
      first_name: user.displayName?.split(' ')[0] || '',
      last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
      avatar_url: user.photoURL,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
  
  return userCredential;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
  
  try {
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch (error) {
    console.error('Error clearing server session:', error);
  }
};

export const createUserProfile = async (
  userId: string,
  data: any
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    ...data,
    id: userId,
    role: "user",
  });
};

export const checkUserExists = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
};

export const getUserProfile = async (userId: string): Promise<any> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  return null;
};

export const updateUserProfile = async (
  userId: string,
  data: any
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

// Initialize auth state listener to ensure users are always added to Firestore
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        // Check if user exists in Firestore
        const exists = await checkUserExists(user.uid);
        
        // If not, create a profile
        if (!exists) {
          await createUserProfile(user.uid, {
            email: user.email,
            first_name: user.displayName?.split(' ')[0] || '',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
            avatar_url: user.photoURL,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          console.log(`Created new user profile for ${user.email}`);
        }
      } catch (error) {
        console.error('Error ensuring user exists in Firestore:', error);
      }
    }
  });
}

export { app, auth, db };
