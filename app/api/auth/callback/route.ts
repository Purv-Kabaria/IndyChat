import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // If there is no code, then we don't have anything to process
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=No authorization code found`);
  }
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    
    // If we have a valid session, make sure user has a profile
    if (data?.session?.user) {
      const { user } = data.session;
      
      // Get user metadata to extract name information
      let firstName = user.user_metadata?.first_name;
      let lastName = user.user_metadata?.last_name;
      let avatarUrl = user.user_metadata?.avatar_url;
      
      // If we don't have first/last name in metadata, try to extract from raw provider data
      if ((!firstName || !lastName) && user.app_metadata?.provider === 'google') {
        const rawUserData = user.user_metadata?.raw_user_meta_data || {};
        const googleName = rawUserData.name || '';
        
        if (googleName && !firstName && !lastName) {
          // Split the name into first and last name
          const nameParts = googleName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Get avatar from Google data if available
        if (!avatarUrl && rawUserData.picture) {
          avatarUrl = rawUserData.picture;
        }
      }
      
      // Update the user's metadata with extracted info if we found something
      if (firstName || lastName || avatarUrl) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
            avatar_url: avatarUrl || null,
          }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
        }
      }
      
      // Create or update the profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          first_name: firstName || '',
          last_name: lastName || '',
          avatar_url: avatarUrl || null,
          role: 'user', // Default role is "user", not admin
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
      } else {
        console.log('Successfully created/updated profile for OAuth user');
      }
    }
    
    // Redirect to the intended destination
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/chat';
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Unexpected error in authentication`);
  }
} 