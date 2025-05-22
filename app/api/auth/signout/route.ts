import { NextResponse } from "next/server";
import { adminAuth } from '../firebase-admin';

export async function POST(request: Request) {
  try {
    // Get the session cookie from the request
    const cookieValue = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('firebase-auth-token='))
      ?.split('=')[1];
    
    if (cookieValue) {
      // Verify the session cookie and revoke all user sessions
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(cookieValue);
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Clear the session cookie
    response.cookies.set({
      name: 'firebase-auth-token',
      value: '',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
} 