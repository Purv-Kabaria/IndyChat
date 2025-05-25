"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { logOut } from "@/lib/firebase";

type SignOutButtonProps = {
  variant?: "default" | "minimal" | "icon";
  redirectTo?: string;
  className?: string;
  onSignOut?: () => void;
};

export default function SignOutButton({
  variant = "default",
  redirectTo = "/",
  className = "",
  onSignOut,
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Sign out using Firebase
      await logOut();
      
      if (onSignOut) {
        await onSignOut();
      }

      router.refresh();

      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    } catch (error) {
      console.error("Failed to sign out:", error);

      if (onSignOut) {
        try {
          await onSignOut();
        } catch (callbackError) {
          console.error("Error in onSignOut callback:", callbackError);
        }
      }

      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Sign out">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`text-sm hover:underline transition-colors flex items-center ${className}`}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center ${className}`}>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <LogOut className="h-5 w-5 mr-2" />
      )}
      Sign out
    </button>
  );
}
