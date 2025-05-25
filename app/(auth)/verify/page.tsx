"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase"; // ADD Firebase
import { onAuthStateChanged, sendEmailVerification, User as FirebaseUser } from "firebase/auth"; // ADD Firebase User type
import { Loader2 } from "lucide-react";

type VerificationError = {
  message: string;
  code?: string;
};

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || ""; // Renamed to avoid confusion with user.email
  const redirectTo = searchParams.get("redirectTo") || "/chat";
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setSessionChecking(true);
      if (user) {
        setCurrentUserEmail(user.email);
        if (user.emailVerified) {
          setMessage("Your email is already verified! Redirecting...");
          setTimeout(() => {
            router.push(redirectTo || '/chat');
          }, 2000);
        } else {
          setMessage("Please verify your email. If you received a code, enter it below, or request a new verification email.");
        }
      } else {
        setCurrentUserEmail(null);
        // If no user, and emailFromQuery is present, they might be trying to verify post-signup without login
        if (!emailFromQuery) {
           setError("No user session found. Please log in or ensure you have an email in the link to verify.");
        } else {
            setMessage(`Attempting to verify for ${emailFromQuery}. If you received a code, enter it below.`);
        }
      }
      setSessionChecking(false);
    });
    return () => unsubscribe();
  }, [router, redirectTo, emailFromQuery]);
  const handleResendOTP = async () => { // Renamed for clarity, though it sends an email link with Firebase
    const targetEmail = auth.currentUser?.email || emailFromQuery;
    if (!targetEmail) {
      setError("Email is required to resend verification link.");
      return;
    }
    
    setResending(true);
    setError(null);
    setMessage(null);
    
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        setMessage("A new verification email has been sent to your registered email address.");
      } else if (auth.currentUser && auth.currentUser.emailVerified) {
        setMessage("Your email is already verified.");
      } else {
        setError("Please ensure you are logged in with the email you want to verify, or check the email sent during signup.");
      }
    } catch (error: unknown) {
      const resendError = error as VerificationError;
      setError(resendError.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

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
            Please check your email inbox for a verification link sent to{" "}
            <span className="font-medium">{currentUserEmail || emailFromQuery || "your email"}</span>.
          </p>
          <p className="text-sm text-gray-500 mt-1">If your email is not verified, click the link in the email.</p>
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

        {auth.currentUser && !auth.currentUser.emailVerified && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Didn&apos;t receive a verification email?{" "}
              <button 
                onClick={handleResendOTP} // Renamed from handleResendOTP for clarity
                disabled={resending}
                className="text-accent hover:underline font-medium disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

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