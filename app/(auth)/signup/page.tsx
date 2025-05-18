"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type AuthError = {
  message: string;
  status?: number;
  name?: string;
};

type UserSession = {
  user: {
    email: string;
    email_confirmed_at?: string;
    confirmation_sent_at?: string;
  } | null;
  session: {
    user: {
      id: string;
      email?: string;
      email_confirmed_at?: string;
    };
  } | null;
};

function SignupPageContent() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);

  // Verify environment variables and Supabase client on component mount
  // Also check session status to handle already authenticated users
  useEffect(() => {
    const checkSupabaseConfig = async () => {
      // Check if Supabase environment variables are set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (process.env.NODE_ENV !== "production") {
        console.log("Environment check:", {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
        });
      }
      
      if (!supabaseUrl || !supabaseKey) {
        setEnvStatus("Warning: Supabase environment variables are missing");
        setSessionChecked(true);
        return;
      }
      
      // Check for forceRedirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const forceRedirect = urlParams.get('forceRedirect');
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Supabase session retrieval error:", error);
          setEnvStatus("Error retrieving session");
        } else {
          // Store the session for use in rendering
          setCurrentSession(data.session ? {
            user: {
              email: data.session.user.email || '',
              email_confirmed_at: data.session.user.email_confirmed_at
            },
            session: data.session
          } : null);
          
          // Only auto-redirect if a session exists and forceRedirect is not explicitly 'false'
          if (data.session && forceRedirect !== 'false') {
            console.log("Active session detected, preparing redirect");
            
            // Check if this is a Google OAuth user - they don't need email verification
            const isOAuthProvider = data.session.user.app_metadata?.provider === 'google';
            
            // Google OAuth users always skip verification
            if (isOAuthProvider) {
              console.log("OAuth user detected, redirecting to chat");
              router.push("/chat");
              return;
            }
            
            // If email is not verified for password-based auth, redirect to verification
            if (data.session.user.email && !data.session.user.email_confirmed_at) {
              console.log("Unverified email, redirecting to verification");
              router.push(`/verify?email=${encodeURIComponent(data.session.user.email)}`);
              return;
            }
            
            // Redirect to chat for fully authenticated users
            console.log("Authenticated session, redirecting to chat");
            router.push("/chat");
            return;
          }
        }
      } catch (err) {
        console.error("Unexpected error during session check:", err);
        setEnvStatus("Unexpected error checking session");
      } finally {
        setSessionChecked(true);
      }
    };
    
    checkSupabaseConfig();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log("Starting signup process...");
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables are missing");
      setError("Configuration error. Please contact support.");
      setLoading(false);
      return;
    }

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    console.log("Form data validated, proceeding with signup...");

    try {
      // Log signup payload (without sensitive data)
      console.log("Signup request:", {
        email,
        hasPassword: !!password,
        userData: {
          first_name: firstName,
          last_name: lastName,
        }
      });
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      // Log response (but not sensitive data)
      console.log("Signup response:", {
        success: !error,
        hasData: !!data,
        hasUser: data?.user ? true : false,
        hasSession: data?.session ? true : false,
        emailConfirmed: data?.user?.email_confirmed_at ? true : false,
        identities: data?.user?.identities?.length,
        createdAt: data?.user?.created_at,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null
      });

      if (error) throw error;
      
      // Check if the user has already confirmed their email
      if (data?.user?.email_confirmed_at) {
        console.log("Email already verified, redirecting to dashboard...");
        
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
        return;
      }
      
      // Check if Supabase returned confirmation details
      console.log("User registration status:", {
        confirmationSent: data?.user?.confirmation_sent_at ? true : false,
        identitiesLength: data?.user?.identities?.length || 0
      });
      
      console.log("Signup successful, redirecting to verification page...");
      
      // Check if the verification email was sent
      if (data?.user?.confirmation_sent_at) {
        console.log("Verification email sent at:", data.user.confirmation_sent_at);
      } else {
        console.warn("No confirmation_sent_at timestamp in response");
      }
      
      // Use setTimeout to show the success message before redirecting
      setTimeout(() => {
        // Redirect to verification page with email and explicit redirect to chat
        router.push(`/verify?email=${encodeURIComponent(email)}&redirectTo=/chat`);
      }, 2000);
    } catch (error: unknown) {
      console.error("Signup error:", error);
      
      // Enhanced error reporting
      let errorMessage = "An error occurred during signup";
      
      const authError = error as AuthError;
      
      if (authError.message) {
        errorMessage = authError.message;
      }
      
      if (authError.status) {
        errorMessage += ` (Status: ${authError.status})`;
      }
      
      // Check for specific error types and provide more helpful messages
      if (errorMessage.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
        
        // Offer option to navigate to login
        setTimeout(() => {
          router.push("/login");
        }, 5000);
      } else if (errorMessage.includes("network")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("email verification")) {
        errorMessage = "There was an issue sending the verification email. Please try again or contact support.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage = "Too many signup attempts. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    
    console.log("Starting Google sign in process...");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      console.log("Google OAuth response:", {
        success: !error,
        error: error ? {
          message: error.message,
          status: error.status
        } : null
      });

      if (error) throw error;
    } catch (error: unknown) {
      console.error("Google sign in error:", error);
      const authError = error as AuthError;
      setError(authError.message || "An error occurred with Google sign in");
      setLoading(false);
    }
  };

  // Don't render the form until the session check is complete
  if (!sessionChecked) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">IndyChat</h1>
          <p className="text-sm text-gray-500 mt-2">Create your account</p>
        </div>

        {envStatus && (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg mb-4 text-sm">
            <strong>Debug:</strong> {envStatus}
          </div>
        )}
        
        {/* Add a hint for logged-in users */}
        {sessionChecked && currentSession && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4 text-sm">
            <strong>Note:</strong> You are currently logged in. 
            If you want to create another account, 
            <Link 
              href="/signup?forceRedirect=false" 
              className="ml-1 underline font-medium"
            >
              click here
            </Link>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-accent mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-accent mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-accent mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-accent mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-accent mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Sign Up
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md p-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Image src="/images/google.svg" alt="Google" width={20} height={20} />
            Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function SignupPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">Loading signup page...</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
} 