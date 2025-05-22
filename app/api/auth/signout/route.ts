import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/app/api/auth/firebase-admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie
        );

        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch (error) {
        console.error("Error verifying session during signout:", error);
      }
    }

    cookieStore.set("__session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
