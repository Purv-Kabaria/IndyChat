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
  User
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  FieldValue,
  Timestamp
} from "firebase/firestore";
import type { UserProfile } from './auth-context';

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

interface ProfileUpdateData extends Omit<Partial<UserProfile>, 'created_at' | 'updated_at'> {
  created_at?: FieldValue | Timestamp | string | null;
  updated_at?: FieldValue | Timestamp | string | null;
}

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

  const profileToCreate: ProfileUpdateData = {
    ...userData,
    email: userCredential.user.email,
    role: userData.role || "user",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await createUserProfile(userCredential.user.uid, profileToCreate as Partial<UserProfile>);

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
    const profileData: ProfileUpdateData = {
      email: user.email,
      first_name: user.displayName?.split(' ')[0] || '',
      last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
      avatar_url: user.photoURL,
      role: 'user',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await createUserProfile(user.uid, profileData as Partial<UserProfile>);
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
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  
  const profileDataToSet: ProfileUpdateData = {
    id: userId,
    role: "user",
    ...data,
    created_at: (data.created_at && (data.created_at instanceof Timestamp || typeof data.created_at === 'string'))
                  ? data.created_at 
                  : (data.created_at || serverTimestamp()),
    updated_at: serverTimestamp(),
  };
  await setDoc(userRef, profileDataToSet);
};

export const checkUserExists = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  
  const dataToUpdate: Omit<Partial<UserProfile>, 'updated_at' | 'id'> & { updated_at: FieldValue; id?: string } = {
    ...data,
    id: undefined,
    updated_at: serverTimestamp(),
  };
  delete dataToUpdate.id;

  await updateDoc(userRef, dataToUpdate);
};

export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.role === "admin";
};

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const exists = await checkUserExists(user.uid);
        if (!exists) {
          const profileData: ProfileUpdateData = {
            email: user.email,
            first_name: user.displayName?.split(' ')[0] || '',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
            avatar_url: user.photoURL,
            role: 'user',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          };
          await createUserProfile(user.uid, profileData as Partial<UserProfile>);
          console.log(`Created new user profile for ${user.email} in onAuthStateChanged`);
        }
      } catch (error) {
        console.error('Error ensuring user exists in Firestore (onAuthStateChanged):', error);
      }
    }
  });
}

export { app, auth, db };
