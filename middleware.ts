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
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  // If accessing a protected route without session, redirect to login
  if (!session && (isProtectedRoute || isAdminRoute)) {
    const redirectUrl = new URL('/login', request.url);
    // Preserve original URL to redirect back after login
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    console.log('[Middleware] Redirecting unauthenticated user from protected route to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // For admin routes, check if user has admin role
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      console.log('[Middleware] Non-admin user attempting to access admin route');
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // If already logged in and trying to access login/reset-password, redirect appropriately
  if (session && isLoginOrResetPasswordRoute) {
    // Check user role to determine redirect destination
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    const redirectUrl = new URL(profile?.role === 'admin' ? '/admin' : '/chat', request.url);
    // Preserve any query params from the original URL
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    console.log('[Middleware] Redirecting authenticated user from login/reset to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }
  
  // Special handling for signup route
  if (isSignupRoute) {
    // If logged in, offer option to redirect to chat
    if (session) {
      const url = new URL(request.url);
      const forceRedirect = url.searchParams.get('forceRedirect');
      console.log('[Middleware] Signup route access with session. forceRedirect =', forceRedirect);
      
      if (forceRedirect !== 'false') {
        const redirectUrl = new URL('/chat', request.url);
        // Preserve any query params from the original URL
        request.nextUrl.searchParams.forEach((value, key) => {
          if (key !== 'forceRedirect') { // Don't carry over forceRedirect
            redirectUrl.searchParams.set(key, value);
          }
        });
        console.log('[Middleware] Redirecting to chat from signup:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log('[Middleware] Allowing access to signup with forceRedirect=false');
      }
    } else {
      console.log('[Middleware] Allowing access to signup (no session)');
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
    '/admin/:path*', // Added admin routes to the matcher
  ],
};
