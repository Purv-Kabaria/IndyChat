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
        // Initialize user metadata for Google OAuth users
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          // Check if we need to initialize metadata
          const hasMetadata = user.user_metadata?.first_name || user.user_metadata?.last_name;
          
          if (!hasMetadata) {
            // Get the raw OAuth data from Google
            const rawUserData = user.user_metadata?.raw_user_meta_data || {};
            // Google OAuth data is directly in user_metadata, not in raw_user_meta_data
            const googleName = user.user_metadata?.name || '';
            const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            
            console.log('Google OAuth data:', {
              name: googleName,
              avatar: googleAvatar,
              metadata: user.user_metadata
            });
            
            // Split the name into first and last name
            const nameParts = googleName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                first_name: firstName,
                last_name: lastName,
                avatar_url: googleAvatar,
                tts_enabled: false,
                stt_enabled: false,
              }
            });

            if (updateError) {
              console.error('Error updating user metadata:', updateError);
            }
          }
        }
        
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