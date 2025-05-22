"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import {
  applyActionCode,
  checkActionCode,
  sendEmailVerification,
  ActionCodeSettings,
  AuthError,
} from "firebase/auth";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const oobCode = searchParams.get("oobCode") || "";
  const mode = searchParams.get("mode") || "";

  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  useEffect(() => {
    const verifyEmailLink = async () => {
      if (oobCode && mode === "verifyEmail") {
        setIsVerifying(true);
        try {
          await checkActionCode(auth, oobCode);

          await applyActionCode(auth, oobCode);

          setMessage("Email verified successfully! Redirecting...");

          setTimeout(() => {
            if (user) {
              router.push("/chat");
            } else {
              router.push(
                `/login?message=${encodeURIComponent(
                  "Email verified successfully. You can now log in."
                )}`
              );
            }
          }, 2000);
        } catch (error) {
          const authError = error as AuthError;
          console.error("Email verification error:", authError);

          let errorMessage =
            "Invalid or expired verification link. Please request a new one.";
          if (authError.code === "auth/invalid-action-code") {
            errorMessage =
              "The verification link has expired or already been used.";
          }

          setError(errorMessage);
        } finally {
          setIsVerifying(false);
          setSessionChecking(false);
        }
      } else {
        setSessionChecking(false);
      }
    };

    const checkVerificationStatus = async () => {
      if (user) {
        if (user.emailVerified) {
          setMessage("Your email is already verified! Redirecting...");

          setTimeout(() => {
            router.push("/chat");
          }, 2000);
        }
        setSessionChecking(false);
      } else if (!oobCode) {
        setSessionChecking(false);
      }
    };

    if (oobCode) {
      verifyEmailLink();
    } else {
      checkVerificationStatus();
    }
  }, [oobCode, mode, user, router]);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Email is required to resend verification link");
      return;
    }

    setResending(true);
    setError(null);

    try {
      if (user) {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/chat`,
          handleCodeInApp: false,
        } as ActionCodeSettings);
      } else {
        router.push(
          `/login?message=${encodeURIComponent(
            "Please log in first to verify your email"
          )}`
        );
        return;
      }

      setMessage("A new verification link has been sent to your email");
    } catch (error: unknown) {
      const resendError = error as AuthError;

      let errorMessage =
        resendError.message || "Failed to resend verification link";
      if (resendError.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  if (sessionChecking) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">
            Checking verification status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">
            Verify Email
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {oobCode
              ? "Verifying your email..."
              : `Check your inbox for a verification link sent to ${
                  email || "your email"
                }`}
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

        {isVerifying && (
          <div className="flex justify-center my-6">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}

        {!oobCode && !isVerifying && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Didn&apos;t receive a verification link?
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
              {resending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Resend Verification Link
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="text-accent hover:underline font-medium">
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
        <p className="mt-2 text-sm text-gray-500">
          Loading verification page...
        </p>
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
