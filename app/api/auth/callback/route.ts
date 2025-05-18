import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    await supabase.auth.exchangeCodeForSession(code);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const isOAuthProvider = session.user.app_metadata?.provider === 'google';
      
      if (isOAuthProvider) {
        return NextResponse.redirect(new URL('/chat', request.url));
      }
      
      if (session.user.email && !session.user.email_confirmed_at) {
        return NextResponse.redirect(
          new URL(`/verify?email=${encodeURIComponent(session.user.email)}&redirectTo=/chat`, request.url)
        );
      }
      
      return NextResponse.redirect(new URL('/chat', request.url));
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.redirect(new URL('/login', request.url));
} 