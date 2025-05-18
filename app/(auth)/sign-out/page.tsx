"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from "lucide-react";

type AuthError = {
  message: string;
  code?: string;
};

export default function SignOutPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const signOut = async () => {
      try {
        // Sign out the user
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw error;
        }
        
        // Successfully signed out, redirect to home page after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error: unknown) {
        console.error("Error signing out:", error);
        setError((error as AuthError).message || "An error occurred during sign out");
        
        // Even if there's an error, redirect to home after a delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    signOut();
  }, [router, supabase.auth]);
  
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-cal font-bold text-accent mb-4">Signing Out</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center gap-4 mt-8">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-gray-500">Signing out...</p>
            </>
          ) : (
            <>
              <p className="text-green-600">Successfully signed out!</p>
              <p className="text-gray-500 text-sm">Redirecting to home page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

