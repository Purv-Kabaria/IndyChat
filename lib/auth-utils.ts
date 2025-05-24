import { auth, db } from "./firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { NextRequest, NextResponse } from 'next/server';

export type UserRole = "user" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  address: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
};

export async function getUserRole(
  user?: User | null
): Promise<UserRole | null> {
  try {
    if (!user) {
      user = auth.currentUser;
      if (!user) return null;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error("User document not found");
      return null;
    }

    return userDoc.data().role as UserRole;
  } catch (error) {
    console.error("Unexpected error getting user role:", error);
    return null;
  }
}

export async function isAdmin(user?: User | null): Promise<boolean> {
  try {
    if (!user) {
      user = auth.currentUser;
      if (!user) return false;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }

    return userDoc.data().role === "admin";
  } catch (error) {
    console.error("Unexpected error checking admin status:", error);
    return false;
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const isCurrentUserAdmin = await isAdmin();
    if (!isCurrentUserAdmin) {
      console.error("Only admins can update user roles");
      return false;
    }

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      role,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Unexpected error updating user role:", error);
    return false;
  }
}

export async function getAllUsers(): Promise<UserProfile[] | null> {
  try {
    const isCurrentUserAdmin = await isAdmin();
    if (!isCurrentUserAdmin) {
      console.error("Only admins can retrieve all users");
      return null;
    }

    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email || "",
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        avatar_url: userData.avatar_url || null,
        address: userData.address || null,
        role: userData.role || "user",
        created_at: userData.created_at || "",
        updated_at: userData.updated_at || "",
        last_sign_in_at: userData.last_sign_in_at || null,
      });
    });

    return users;
  } catch (error) {
    console.error("Unexpected error fetching all users:", error);
    return null;
  }
}

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;"
};

export const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/verify",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/reset-password",
  "/chat"
];

export const RATE_LIMIT_WINDOW = 60 * 1000;
export const MAX_REQUESTS_PER_WINDOW = {
  "api/auth": 10,
  api: 60,
  default: 100,
};

const rateLimitStore: Record<string, { count: number; timestamp: number }> = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (now - rateLimitStore[key].timestamp > RATE_LIMIT_WINDOW) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css")
  ) {
    return true;
  }

  if (
    pathname.startsWith("/api/auth/") ||
    pathname.includes("oobCode=") ||
    pathname.includes("mode=") ||
    pathname.includes("apiKey=") ||
    pathname.includes("continueUrl=")
  ) {
    return true;
  }

  return false;
}

export function getRateLimitKey(pathname: string, ip: string): string {
  if (pathname.startsWith("/api/auth/")) {
    return `auth:${ip}`;
  } else if (pathname.startsWith("/api/")) {
    return `api:${ip}`;
  }
  return `default:${ip}`;
}

export function applyRateLimit(key: string, pathname: string): boolean {
  const now = Date.now();

  let limit = MAX_REQUESTS_PER_WINDOW.default;
  if (pathname.startsWith("/api/auth/")) {
    limit = MAX_REQUESTS_PER_WINDOW["api/auth"];
  } else if (pathname.startsWith("/api/")) {
    limit = MAX_REQUESTS_PER_WINDOW.api;
  }

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, timestamp: now };
    return true;
  }

  const entry = rateLimitStore[key];

  if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.timestamp = now;
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function parseCookies(request: NextRequest): Record<string, string> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
}
