import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, verifyIdToken } from "@/app/api/auth/firebase-admin";
import { applySecurityHeaders } from "@/lib/auth-utils";

const SESSION_EXPIRY = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      const errorResponse = NextResponse.json(
        { error: "Missing ID token" },
        { status: 400 }
      );
      return applySecurityHeaders(errorResponse);
    }

    try {
      await verifyIdToken(idToken);

      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_EXPIRY * 1000,
      });

      const cookieStore = await cookies();
      cookieStore.set("__session", sessionCookie, {
        maxAge: SESSION_EXPIRY,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
      });

      const successResponse = NextResponse.json({ status: "success" });
      return applySecurityHeaders(successResponse);
    } catch (sessionError) {
      console.error("Error creating session:", sessionError);
      const errorResponse = NextResponse.json(
        { error: "Invalid ID token" },
        { status: 401 }
      );
      return applySecurityHeaders(errorResponse);
    }
  } catch (requestError) {
    console.error("Session creation error:", requestError);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      const response = NextResponse.json({ authenticated: false });
      return applySecurityHeaders(response);
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );

      const response = NextResponse.json({
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: decodedClaims.email_verified,
        },
      });
      return applySecurityHeaders(response);
    } catch {
      const response = NextResponse.json({ authenticated: false });
      return applySecurityHeaders(response);
    }
  } catch (sessionError) {
    console.error("Session verification error:", sessionError);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("__session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    const response = NextResponse.json({ status: "success" });
    return applySecurityHeaders(response);
  } catch (sessionError) {
    console.error("Session deletion error:", sessionError);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}
