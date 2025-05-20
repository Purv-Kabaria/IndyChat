import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  
  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=No authorization code found`
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    
    if (data?.session?.user) {
      const { user } = data.session;

      
      let firstName = user.user_metadata?.first_name;
      let lastName = user.user_metadata?.last_name;
      let avatarUrl = user.user_metadata?.avatar_url;

      
      if (
        (!firstName || !lastName) &&
        user.app_metadata?.provider === "google"
      ) {
        const rawUserData = user.user_metadata?.raw_user_meta_data || {};
        const googleName = rawUserData.name || "";

        if (googleName && !firstName && !lastName) {
          
          const nameParts = googleName.split(" ");
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }

        
        if (!avatarUrl && rawUserData.picture) {
          avatarUrl = rawUserData.picture;
        }
      }

      
      if (firstName || lastName || avatarUrl) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName || "",
            last_name: lastName || "",
            avatar_url: avatarUrl || null,
          },
        });

        if (updateError) {
          console.error("Error updating user metadata:", updateError);
        }
      }

      
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || "",
          first_name: firstName || "",
          last_name: lastName || "",
          avatar_url: avatarUrl || null,
          role: "user", 
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (profileError) {
        console.error("Error creating/updating profile:", profileError);
      }
    }

    
    const redirectTo = requestUrl.searchParams.get("redirectTo") || "/chat";
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
  } catch (error) {
    console.error("Unexpected error in OAuth callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Unexpected error in authentication`
    );
  }
}
