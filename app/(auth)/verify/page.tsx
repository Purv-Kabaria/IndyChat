"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type VerificationError = {
  message: string;
  code?: string;
};

type SessionData = {
  session: {
    user: {
      email_confirmed_at?: string;
    };
  } | null;
};

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const redirectTo = searchParams.get("redirectTo") || "/chat";
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Check if user is already authenticated and if their email is verified
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession() as { 
          data: SessionData; 
          error: VerificationError | null 
        };
        
        if (error) {
          console.error("Error checking session:", error);
          setError("Error verifying authentication status");
        } else if (data?.session) {
          // If user has a session, check if email is verified
          if (data.session.user.email_confirmed_at) {
            setMessage("Your email is already verified! Redirecting...");
            
            // Always redirect to chat after verification
            setTimeout(() => {
              router.push('/chat');
            }, 2000);
          }
        }
      } catch (err: unknown) {
        const sessionError = err as VerificationError;
        console.error("Unexpected error during session check:", sessionError.message);
      } finally {
        setSessionChecking(false);
      }
    };
    
    checkSession();
  }, [router, redirectTo]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, check if the OTP format seems valid to provide better error messages
      if (otp.length < 6) {
        throw new Error("Please enter a valid verification code (at least 6 characters)");
      }
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup"
      });

      if (error) throw error;
      
      setMessage("Email verified successfully! Redirecting...");
      
      // Try to get session after verification
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Redirect after successful verification
      setTimeout(() => {
        // If we have an active session, redirect directly to the chat app
        if (sessionData?.session) {
          router.push('/chat');
        } else {
          // If no session, redirect to login with a success message
          router.push(`/login?message=${encodeURIComponent("Account verified successfully. You can now log in.")}`);
        }
      }, 2000);
      
    } catch (error: unknown) {
      console.error("Verification error:", error);
      
      // Provide more helpful error messages based on the error
      const verifyError = error as VerificationError;
      let errorMessage = verifyError.message || "Invalid or expired code. Please try again.";
      
      if (errorMessage.includes("expired")) {
        errorMessage = "Your verification code has expired. Please request a new one.";
      } else if (errorMessage.includes("incorrect") || errorMessage.includes("invalid")) {
        errorMessage = "Invalid verification code. Please check and try again.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email is required to resend verification code");
      return;
    }
    
    setResending(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email
      });
      
      if (error) throw error;
      
      setMessage("A new verification code has been sent to your email");
    } catch (error: unknown) {
      const resendError = error as VerificationError;
      setError(resendError.message || "Failed to resend verification code");
    } finally {
      setResending(false);
    }
  };

  // Show loading while we check session
  if (sessionChecking) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">Verify Email</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter the verification code sent to{" "}
            <span className="font-medium">{email || "your email"}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-accent mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter your 6-digit code"
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
            Verify Email
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Don&apos;t receive a code?{" "}
            <button 
              onClick={handleResendOTP}
              disabled={resending}
              className="text-accent hover:underline font-medium disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function VerifyPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">Loading verification page...</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageContent />
    </Suspense>
  );
} 