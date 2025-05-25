import { NextResponse } from "next/server";
import { adminAuth, adminDb } from '../firebase-admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get("token");
  // Default redirect target
  let redirectTarget = "/chat";

  if (!idToken) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=No authentication token found`
    );
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    
    // Extract first/last name if available
    let firstName = '';
    let lastName = '';
    
    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Set session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Check for existing user profile
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      await userRef.set({
        id: uid,
        email: email || '',
        first_name: firstName,
        last_name: lastName,
        avatar_url: picture || null,
        role: 'user', // Default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Update last sign in
      await userRef.update({
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString()
      });
      
      // Check if user is admin to set redirect
      const userData = userDoc.data();
      if (userData?.role === 'admin') {
        redirectTarget = '/admin/users';
      }
    }
    
    // Override with URL parameter if provided
    const redirectParam = requestUrl.searchParams.get("redirectTo");
    if (redirectParam) {
      redirectTarget = redirectParam;
    }
    
    // Create response with auth cookie
    const response = NextResponse.redirect(`${requestUrl.origin}${redirectTarget}`);
    
    // Set the cookie
    response.cookies.set({
      name: 'firebase-auth-token',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Authentication error`
    );
  }
}

