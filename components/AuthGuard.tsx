"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  fallback = (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      <p className="text-secondary">Checking authentication...</p>
    </div>
  ),
  redirectTo = "/login",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isEmailVerified } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check if email is not verified AND we're not already on the verify page
        if (!isEmailVerified && !pathname.includes('/verify')) {
          const email = user.email || "";
          router.push(`/verify?email=${encodeURIComponent(email)}`);
        } else {
          setIsAuthorized(true);
        }
      } else {
        const returnPath = window.location.pathname;
        router.push(`${redirectTo}?return_to=${encodeURIComponent(returnPath)}`);
      }
    }
  }, [user, loading, router, redirectTo, isEmailVerified, pathname]);

  if (loading || !isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
} 