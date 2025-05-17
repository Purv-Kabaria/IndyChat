import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  // More nuanced auth route handling
  const isLoginOrResetPasswordRoute = request.nextUrl.pathname.startsWith('/login') || 
                                       request.nextUrl.pathname.startsWith('/reset-password');
  const isSignupRoute = request.nextUrl.pathname.startsWith('/signup');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/chat');
  
  // If accessing a protected route without session, redirect to login
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If already logged in and trying to access login/reset-password, redirect to chat
  if (session && isLoginOrResetPasswordRoute) {
    const redirectUrl = new URL('/chat', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Special handling for signup route
  if (isSignupRoute) {
    // If logged in, offer option to redirect to chat
    if (session) {
      const url = new URL(request.url);
      const forceRedirect = url.searchParams.get('forceRedirect');
      
      if (forceRedirect !== 'false') {
        const redirectUrl = new URL('/chat', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
    // Always allow access to signup route if not redirecting
    return response;
  }
  
  return response;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/chat/:path*',
    '/login',
    '/signup',
    '/reset-password',
    '/verify',
    '/auth/:path*',
  ],
}; 