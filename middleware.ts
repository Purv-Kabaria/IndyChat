import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "./lib/supabase";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLoginOrResetPasswordRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/reset-password");
  const isSignupRoute = req.nextUrl.pathname.startsWith("/signup");
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/chat");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (!session && (isProtectedRoute || isAdminRoute)) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    console.log(
      "[Middleware] Redirecting unauthenticated user from protected route to:",
      redirectUrl.toString()
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      console.log(
        "[Middleware] Non-admin user attempting to access admin route"
      );
      return NextResponse.redirect(new URL("/chat", req.url));
    }
  }

  if (session && isLoginOrResetPasswordRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const redirectUrl = new URL(
      profile?.role === "admin" ? "/admin" : "/chat",
      req.url
    );
    req.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    console.log(
      "[Middleware] Redirecting authenticated user from login/reset to:",
      redirectUrl.toString()
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (isSignupRoute) {
    if (session) {
      const url = new URL(req.url);
      const forceRedirect = url.searchParams.get("forceRedirect");
      console.log(
        "[Middleware] Signup route access with session. forceRedirect =",
        forceRedirect
      );

      if (forceRedirect !== "false") {
        const redirectUrl = new URL("/chat", req.url);
        req.nextUrl.searchParams.forEach((value, key) => {
          if (key !== "forceRedirect") {
            redirectUrl.searchParams.set(key, value);
          }
        });
        console.log(
          "[Middleware] Redirecting to chat from signup:",
          redirectUrl.toString()
        );
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log(
          "[Middleware] Allowing access to signup with forceRedirect=false"
        );
      }
    } else {
      console.log("[Middleware] Allowing access to signup (no session)");
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/login",
    "/signup",
    "/reset-password",
    "/verify",
    "/auth/:path*",
    "/admin/:path*",
  ],
};
