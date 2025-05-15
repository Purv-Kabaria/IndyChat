import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This is needed to properly handle cookies in Next.js 13+
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Extract redirectTo from the URL if it exists
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/chat';
  
  // Check for error parameter in case auth failed
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // If there was an error during auth, redirect to login with error message
  if (error) {
    console.error(`Auth error: ${error}`, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`, request.url)
    );
  }

  try {
    // Initialize Supabase client using the async cookies approach
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    // If code exists, exchange it for a session
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
    
    // Get the current session to check authentication state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No session after auth callback - redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if the user's email is verified
    if (session.user.email && !session.user.email_confirmed_at) {
      console.log('Email not verified - redirecting to verification page');
      return NextResponse.redirect(
        new URL(`/verify?email=${encodeURIComponent(session.user.email)}`, request.url)
      );
    }
    
    // Check if this was a password reset flow
    const type = requestUrl.searchParams.get('type');
    if (type === 'recovery') {
      console.log('Password reset flow - redirecting to update password page');
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    }
    
    // For successful authentication with verified email, redirect to the specified page
    console.log(`Auth successful - redirecting to ${redirectTo}`);
    return NextResponse.redirect(new URL(redirectTo, request.url));
    
  } catch (err) {
    console.error('Error in auth callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=An unexpected error occurred during authentication', request.url)
    );
  }
}

