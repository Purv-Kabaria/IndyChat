import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, verifyIdToken } from "@/app/api/auth/firebase-admin";

const SESSION_EXPIRY = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    try {
      const decodedToken = await verifyIdToken(idToken);

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

      return NextResponse.json({ status: "success" });
    } catch (error) {
      console.error("Error creating session:", error);
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );

      return NextResponse.json({
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: decodedClaims.email_verified,
        },
      });
    } catch (error) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Session deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
