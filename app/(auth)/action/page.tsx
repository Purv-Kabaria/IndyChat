"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from "firebase/auth";
import { Loader2, Home } from "lucide-react";

function AuthActionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [emailForReset, setEmailForReset] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "resetPassword" && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmailForReset(email);
          setMessage("Please enter your new password.");
          setIsVerifying(false);
        })
        .catch((err) => {
          console.error("Invalid or expired oob code for password reset:", err);
          setError(
            "Invalid or expired password reset link. Please try resetting your password again."
          );
          setIsVerifying(false);
        });
    } else if (mode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage(
            "Your email address has been verified successfully! You can now log in."
          );
          setIsVerifying(false);
          setTimeout(() => router.push("/login?message=Email verified successfully"), 3000);
        })
        .catch((err) => {
          console.error("Error verifying email:", err);
          setError(
            "Failed to verify email. The link may be invalid, expired, or the email may already be verified. Please try logging in or request a new verification email if needed."
          );
          setIsVerifying(false);
        });
    } else {
      setError(
        mode ? "Invalid action or missing code." : "No action specified. Please check the link."
      );
      setIsVerifying(false);
    }
  }, [mode, oobCode, router]);

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!oobCode) {
      setError("Missing reset code. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage(
        "Your password has been reset successfully! You can now log in with your new password."
      );
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => router.push("/login?message=Password reset successfully"), 3000);
    } catch (err) {
      console.error("Error confirming password reset:", err);
      setError(
        "Failed to reset password. The link may have expired or been used already. Please try resetting your password again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">Verifying link...</p>
        </div>
      </div>
    );
  }

  if (mode !== "resetPassword" || !emailForReset) {
    if (mode === "verifyEmail" && !error && message) {
      return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white py-2 px-3 rounded-lg text-sm md:hidden">
              <Home className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-cal font-bold text-accent mb-4">Email Verified!</h1>
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
            <Link href="/login" className="text-accent hover:underline font-medium">
              Proceed to Login
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
           <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white py-2 px-3 rounded-lg text-sm md:hidden">
            <Home className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-cal font-bold text-accent mb-4">Action Required</h1>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
       <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white py-2 px-3 rounded-lg text-sm md:hidden">
        <Home className="h-4 w-4" />
      </Link>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-cal font-bold text-accent">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter a new password for {emailForReset}.
          </p>
        </div>

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

        <form onSubmit={handleConfirmResetPassword} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-accent mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-accent mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || isVerifying}
            className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Reset Password
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function AuthActionPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">Loading action page...</p>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<AuthActionPageFallback />}>
      <AuthActionPageContent />
    </Suspense>
  );
} 