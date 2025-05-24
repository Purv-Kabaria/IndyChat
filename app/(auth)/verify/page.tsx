"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { applyActionCode } from "firebase/auth";
import { Loader2 } from "lucide-react";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    "Verifying your email..."
  );

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (mode === "verifyEmail" && oobCode) {
      setLoading(true);
      setError(null);
      setMessage("Verifying your email, please wait...");

      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage("Email verified successfully! Redirecting to chat...");
          setTimeout(() => {
            router.push("/chat");
          }, 3000);
        })
        .catch((err) => {
          console.error("Firebase verification error:", err);
          let friendlyMessage = "Failed to verify email.";
          if (err.code === "auth/invalid-action-code") {
            friendlyMessage =
              "Verification link is invalid or has expired. Please try signing up again or requesting a new verification email if possible.";
          } else if (err.code === "auth/user-disabled") {
            friendlyMessage = "This user account has been disabled.";
          } else if (err.code === "auth/user-not-found") {
            friendlyMessage =
              "User not found. It's possible the account was deleted.";
          }
          setError(friendlyMessage);
          setMessage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (mode && mode !== "verifyEmail") {
      setError("Invalid action. Please check the link and try again.");
      setMessage(null);
      setLoading(false);
    } else if (!oobCode) {
      setMessage(
        "Waiting for verification link. If you've received an email, please click the link in it."
      );
      setError(null);
      setLoading(false);
    } else {
      setError(
        "Invalid verification attempt. Please use the link provided in your email."
      );
      setMessage(null);
      setLoading(false);
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">{message || "Processing..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-cal font-bold text-accent mb-6">
          Email Verification
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {message && !error && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {!loading && (error || message) && (
          <p className="mt-6 text-sm text-gray-500">
            <Link
              href="/login"
              className="text-accent hover:underline font-medium">
              Go to Login
            </Link>
          </p>
        )}

        {!loading &&
          !searchParams.get("oobCode") &&
          !searchParams.get("mode") && (
            <p className="mt-4 text-sm text-gray-500">
              This page is used to verify your email address after signing up.
              Please check your email for a verification link.
            </p>
          )}
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
