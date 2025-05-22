import { cookies } from "next/headers";
import { cache } from "react";
import {
  adminDb,
  verifyIdToken,
} from "@/app/api/auth/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: {
    toDate: () => Date;
  } | string;
  updated_at?: {
    toDate: () => Date;
  } | string;
  [key: string]: unknown;
}

export const getCurrentUser = cache(
  async (): Promise<DecodedIdToken | null> => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("__session")?.value;

      if (!token) return null;

      try {
        const decodedToken = await verifyIdToken(token);
        return decodedToken;
      } catch (error) {
        console.error("Error verifying Firebase token:", error);
        return null;
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
);

export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();

    if (!user) return null;

    const userDoc = await adminDb.collection("users").doc(user.uid).get();

    if (!userDoc.exists) return null;

    return {
      ...userDoc.data(),
      id: user.uid,
    } as UserProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
});

export const isAdmin = cache(async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    return profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
});

export const createServerAuthContext = async () => {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile() : null;

  return {
    user,
    profile,
    isAdmin: profile?.role === "admin" || false,
    isAuthenticated: !!user,
  };
};

export const createServerFirebaseClient = () => {
  return {
    auth: {
      getUser: async () => {
        const user = await getCurrentUser();
        return { data: { user }, error: null };
      },
    },
    firestore: {
      collection: (collectionName: string) => {
        return adminDb.collection(collectionName);
      },
      doc: (path: string) => {
        return adminDb.doc(path);
      },
    },
  };
};
