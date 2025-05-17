"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SignOutButton from "@/components/SignOutButton";

export default function Home() {
  const supabase = createClientComponentClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Function to check auth state - can be called after sign-out
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setIsAuthenticated(false);
        setUserName(null);
        return;
      }
      
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        const firstName = session.user.user_metadata?.first_name || '';
        const lastName = session.user.user_metadata?.last_name || '';
        if (firstName || lastName) {
          setUserName(`${firstName} ${lastName}`.trim());
        } else {
          setUserName(session.user.email?.split('@')[0] || 'User');
        }
      } else {
        setUserName(null);
      }
    } catch (err) {
      console.error("Error in checkSession:", err);
      setIsAuthenticated(false);
      setUserName(null);
    }
  };

  // Setup an auth state change listener
  useEffect(() => {
    checkSession();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        if (session?.user) {
          const firstName = session.user.user_metadata?.first_name || '';
          const lastName = session.user.user_metadata?.last_name || '';
          if (firstName || lastName) {
            setUserName(`${firstName} ${lastName}`.trim());
          } else {
            setUserName(session.user.email?.split('@')[0] || 'User');
          }
        } else {
          setUserName(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6 py-16">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl md:text-6xl font-cal font-bold text-white mb-4">
            Welcome to IndyChat
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">
            Your AI-powered assistant for Indianapolis information
          </p>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center items-center mt-8">
            {isAuthenticated === null ? (
              <div className="h-12 w-32 bg-white/20 animate-pulse rounded-md"></div>
            ) : isAuthenticated ? (
              <>
                <Link 
                  href="/chat" 
                  className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-md transition-colors"
                >
                  Go to Chat
                </Link>
                <SignOutButton variant="minimal" className="mt-4 sm:mt-0" />
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-6 py-3 bg-white text-accent hover:bg-gray-100 font-medium rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-medium rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {isAuthenticated && userName && (
            <p className="mt-6 text-white/70">
              Welcome back, {userName}!
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} IndyChat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
