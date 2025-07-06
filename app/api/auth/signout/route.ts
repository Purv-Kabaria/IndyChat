import { NextResponse } from "next/server";
import { adminAuth } from "../firebase-admin";

export async function POST(request: Request) {
  try {
    const cookieValue = request.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("firebase-auth-token="))
      ?.split("=")[1];

    if (cookieValue) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(cookieValue);
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "firebase-auth-token",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
