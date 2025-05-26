import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
};

export function initFirebaseAdmin() {
  if (getApps().length === 0) {
    const app = initializeApp(firebaseAdminConfig);
    return app;
  }
  return getApps()[0];
}

export const firebaseAdmin = initFirebaseAdmin();
export const adminAuth = getAuth(firebaseAdmin);
export const adminDb = getFirestore(firebaseAdmin);
