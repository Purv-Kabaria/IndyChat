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
  const isAuthRoute = request.nextUrl.pathname.startsWith('/(auth)') || 
                     request.nextUrl.pathname.startsWith('/auth/');
  
  // If accessing a protected route without session, redirect to login
  if (!session && request.nextUrl.pathname.startsWith('/chat')) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and trying to access auth pages, redirect to chat
  if (session && isAuthRoute) {
    const redirectUrl = new URL('/chat', request.url);
    return NextResponse.redirect(redirectUrl);
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