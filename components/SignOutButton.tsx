"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, LogOut } from "lucide-react";

type SignOutButtonProps = {
  variant?: "default" | "minimal" | "icon";
  redirectTo?: string;
  className?: string;
  onSignOut?: () => void; // Optional callback after sign-out completes
};

export default function SignOutButton({ 
  variant = "default", 
  redirectTo = "/", 
  className = "",
  onSignOut
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Sign out the user using Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      
      // Execute the onSignOut callback if provided
      if (onSignOut) {
        await onSignOut();
      }
      
      // Redirect to home page after sign out
      console.log("User signed out successfully, redirecting to:", redirectTo);
      router.refresh(); // Refresh to update auth state
      
      // Small delay to ensure state changes are processed
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    } catch (error) {
      console.error("Failed to sign out:", error);
      
      // Try to call onSignOut callback even in error case
      if (onSignOut) {
        try {
          await onSignOut();
        } catch (callbackError) {
          console.error("Error in onSignOut callback:", callbackError);
        }
      }
      
      // Continue with redirect even if there was an error
      router.push(redirectTo);
    } finally {
      setLoading(false);
    };
  };

  // Different button styles based on variant
  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Sign out"
      >
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
        className={`text-sm hover:underline transition-colors flex items-center ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        Sign out
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <LogOut className="h-5 w-5 mr-2" />
      )}
      Sign out
    </button>
  );
}
