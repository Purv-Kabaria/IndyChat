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
      
      // Use site URL from environment if available
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      
      if (isOAuthProvider) {
        return NextResponse.redirect(new URL('/chat', baseUrl));
      }
      
      if (session.user.email && !session.user.email_confirmed_at) {
        return NextResponse.redirect(
          new URL(`/verify?email=${encodeURIComponent(session.user.email)}&redirectTo=/chat`, baseUrl)
        );
      }
      
      return NextResponse.redirect(new URL('/chat', baseUrl));
    }
    
    // Use site URL from environment if available
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  // Use site URL from environment if available
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.redirect(new URL('/login', baseUrl));
} 