import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../firebase-admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get("token");

  let redirectTarget = "/chat";

  if (!idToken) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=No authentication token found`
    );
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let firstName = "";
    let lastName = "";

    if (name) {
      const nameParts = name.split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        id: uid,
        email: email || "",
        first_name: firstName,
        last_name: lastName,
        avatar_url: picture || null,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      await userRef.update({
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
      });

      const userData = userDoc.data();
      if (userData?.role === "admin") {
        redirectTarget = "/admin/users";
      }
    }

    const redirectParam = requestUrl.searchParams.get("redirectTo");
    if (redirectParam) {
      redirectTarget = redirectParam;
    }

    const response = NextResponse.redirect(
      `${requestUrl.origin}${redirectTarget}`
    );

    response.cookies.set({
      name: "firebase-auth-token",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Authentication error`
    );
  }
}
