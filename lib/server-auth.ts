import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/api/auth/firebase-admin';
import { securityHeaders, isPublicRoute, applyRateLimit, getRateLimitKey } from './auth-utils';

// This file should only be imported in API routes that use Node.js runtime
// Do not import this in Edge API routes or client components

export async function checkAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
}> {
  try {
    // Get session cookie directly from request
    const cookies = parseCookies(request);
    const sessionCookie = cookies["__session"];

    if (!sessionCookie) {
      return { authenticated: false };
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );

      return {
        authenticated: true,
        userId: decodedClaims.uid,
      };
    } catch {
      return { authenticated: false };
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return { authenticated: false };
  }
}

export async function protectApiRoute(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const rateLimitKey = getRateLimitKey(pathname, clientIp);

  if (!applyRateLimit(rateLimitKey, pathname)) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        ...securityHeaders,
      },
    });
  }

  if (isPublicRoute(pathname)) {
    return null;
  }

  const { authenticated } = await checkAuth(request);
  
  if (!authenticated) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...securityHeaders,
      },
    });
  }

  return null;
}

// Helper function to parse cookies from request
function parseCookies(request: NextRequest): Record<string, string> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
} 