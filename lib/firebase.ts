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
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import type { UserProfile } from "./auth-context";
import type { Conversation, Message, EmbeddedMessage } from "@/types/chat";

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

interface ProfileUpdateData
  extends Omit<Partial<UserProfile>, "created_at" | "updated_at"> {
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
  await createUserProfile(
    userCredential.user.uid,
    profileToCreate as Partial<UserProfile>
  );

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
      first_name: user.displayName?.split(" ")[0] || "",
      last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
      avatar_url: user.photoURL,
      role: "user",
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

  const profileDataToSet: ProfileUpdateData = {
    id: userId,
    role: "user",
    ...data,
    created_at:
      data.created_at &&
      (data.created_at instanceof Timestamp ||
        typeof data.created_at === "string")
        ? data.created_at
        : data.created_at || serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await setDoc(userRef, profileDataToSet);
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
    return userSnap.data() as UserProfile;
  }

  return null;
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);

  const dataToUpdate: Omit<Partial<UserProfile>, "updated_at" | "id"> & {
    updated_at: FieldValue;
    id?: string;
  } = {
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

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const exists = await checkUserExists(user.uid);
        if (!exists) {
          const profileData: ProfileUpdateData = {
            email: user.email,
            first_name: user.displayName?.split(" ")[0] || "",
            last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
            avatar_url: user.photoURL,
            role: "user",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          };
          await createUserProfile(
            user.uid,
            profileData as Partial<UserProfile>
          );
        }
      } catch (error) {
        console.error(
          "Error ensuring user exists in Firestore (onAuthStateChanged):",
          error
        );
      }
    }
  });
}

export { app, auth, db };

interface FirestoreConversationData {
  user_id: string;
  user_email: string;
  messages: EmbeddedMessage[];
  createdAt: FieldValue;
  updatedAt: FieldValue;
  id?: string;
}

const safeTimestampToDate = (
  timestamp: Timestamp | FieldValue | Date | null | undefined
): Date => {
  if (timestamp && typeof (timestamp as Timestamp).toDate === "function") {
    return (timestamp as Timestamp).toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

export const createConversation = async (
  user_id: string,
  user_email: string,
  initialMessage: Message
): Promise<string> => {
  const docRef = doc(collection(db, "conversations"));

  const firstEmbeddedMessage: EmbeddedMessage = {
    id: initialMessage.id || docRef.id + "_msg_0",
    date: initialMessage.timestamp,
    message: initialMessage.content,
    role: initialMessage.role,
    attachedFiles: initialMessage.attachedFiles || [],
  };

  const conversationData: FirestoreConversationData = {
    id: docRef.id,
    user_id,
    user_email,
    messages: [firstEmbeddedMessage],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, conversationData);
  return docRef.id;
};

export const addMessageToConversation = async (
  conversationId: string,
  message: Message
): Promise<string> => {
  const conversationRef = doc(db, "conversations", conversationId);

  const messageId = message.id || doc(collection(db, "tmp")).id;

  const newMessage: EmbeddedMessage = {
    id: messageId,
    date: message.timestamp,
    message: message.content,
    role: message.role,
    attachedFiles: message.attachedFiles || [],
  };

  await updateDoc(conversationRef, {
    messages: arrayUnion(newMessage),
    updatedAt: serverTimestamp(),
  });

  return messageId;
};

export const getConversationsForUser = async (
  user_id: string
): Promise<Omit<Conversation, "messages">[]> => {
  const q = query(
    collection(db, "conversations"),
    where("user_id", "==", user_id),
    orderBy("updatedAt", "desc"),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  const conversations: Omit<Conversation, "messages">[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    conversations.push({
      id: docSnap.id,
      user_id: data.user_id,
      user_email: data.user_email,
      difyConversationId: data.difyConversationId || undefined,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    } as Omit<Conversation, "messages">);
  });
  return conversations;
};

export const getAllConversations = async (
  limitCount: number = 50
): Promise<Omit<Conversation, "messages">[]> => {
  const q = query(
    collection(db, "conversations"),
    orderBy("updatedAt", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  const conversations: Omit<Conversation, "messages">[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    conversations.push({
      id: docSnap.id,
      user_id: data.user_id,
      user_email: data.user_email,
      difyConversationId: data.difyConversationId || undefined,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    } as Omit<Conversation, "messages">);
  });
  return conversations;
};

export const getConversationWithMessages = async (
  conversationId: string
): Promise<Conversation | null> => {
  const conversationRef = doc(db, "conversations", conversationId);
  const docSnap = await getDoc(conversationRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const messages: EmbeddedMessage[] = (data.messages || []).map(
      (
        msg: Omit<EmbeddedMessage, "date"> & {
          date?: Timestamp | Date | FieldValue;
        }
      ) => ({
        ...msg,
        date: safeTimestampToDate(msg.date),
      })
    );

    return {
      id: docSnap.id,
      user_id: data.user_id,
      user_email: data.user_email,
      messages,
      difyConversationId: data.difyConversationId || undefined,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    } as Conversation;
  }
  return null;
};

export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  const conversationRef = doc(db, "conversations", conversationId);
  await deleteDoc(conversationRef);
};

export const updateConversationDifyId = async (
  firebaseConversationId: string,
  difyConversationId: string
): Promise<void> => {
  const conversationRef = doc(db, "conversations", firebaseConversationId);
  await updateDoc(conversationRef, {
    difyConversationId: difyConversationId,
    updatedAt: serverTimestamp(),
  });
};
