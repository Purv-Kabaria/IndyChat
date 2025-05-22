import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

interface FirebaseAdminError extends Error {
  code?: string;
  context?: string;
}

const handleAdminError = (error: any, context: string): FirebaseAdminError => {
  console.error(`Firebase Admin ${context} error:`, error);

  const adminError: FirebaseAdminError = new Error(
    error.message || `An error occurred during ${context}`
  );

  adminError.code = error.code || "unknown";
  adminError.context = context;

  if (process.env.NODE_ENV === "production") {
  }

  return adminError;
};

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const validateConfig = () => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
};

export function initFirebaseAdmin(): App {
  try {
    validateConfig();

    if (adminApp) {
      return adminApp;
    }

    if (getApps().length === 0) {
      adminApp = initializeApp(firebaseAdminConfig);
      console.log("Firebase Admin initialized successfully");
      return adminApp;
    }

    adminApp = getApps()[0];
    return adminApp;
  } catch (error) {
    throw handleAdminError(error, "initialization");
  }
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = initFirebaseAdmin();
    adminAuthInstance = getAuth(app);
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    const app = initFirebaseAdmin();
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}

export function getAdminStorage() {
  const app = initFirebaseAdmin();
  return getStorage(app);
}

export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch (error) {
    throw handleAdminError(error, "token verification");
  }
}

export async function getUserById(uid: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUser(uid);
  } catch (error) {
    throw handleAdminError(error, "user retrieval");
  }
}

export async function createCustomToken(
  uid: string,
  claims?: Record<string, any>
) {
  try {
    const auth = getAdminAuth();
    return await auth.createCustomToken(uid, claims);
  } catch (error) {
    throw handleAdminError(error, "custom token creation");
  }
}

export async function setCustomUserClaims(
  uid: string,
  claims: Record<string, any>
) {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    throw handleAdminError(error, "setting custom claims");
  }
}

initFirebaseAdmin();

export const firebaseAdmin = adminApp;
export const adminAuth = getAdminAuth();
export const adminDb = getAdminDb();
