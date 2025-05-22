"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  AuthError,
} from "firebase/auth";

type FirebaseError = {
  message: string;
  code?: string;
};

function UpdatePasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        router.push("/login?message=Invalid or missing reset code");
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
      } catch (error) {
        console.error("Error verifying reset code:", error);
        router.push(
          "/login?message=Invalid or expired reset link. Please request a new one."
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      setLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);

      setMessage("Password updated successfully");

      setTimeout(() => {
        router.push(
          "/login?message=Password updated successfully. You can now log in."
        );
      }, 2000);
    } catch (error: unknown) {
      const authError = error as FirebaseError;

      let errorMessage = "An error occurred while updating your password";

      if (authError.code === "auth/expired-action-code") {
        errorMessage =
          "The password reset link has expired. Please request a new one.";
      } else if (authError.code === "auth/invalid-action-code") {
        errorMessage =
          "The password reset link is invalid. Please request a new one.";
      } else if (authError.code === "auth/weak-password") {
        errorMessage = "Please choose a stronger password";
      } else {
        console.error("Password update error:", authError);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">
            Update Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Create a new password for{" "}
            {email ? (
              <span className="font-medium">{email}</span>
            ) : (
              "your account"
            )}
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

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-accent mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              aria-describedby="password-description"
            />
            <p id="password-description" className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and
              numbers
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-accent mb-1">
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
            className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

function UpdatePasswordPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">
          Loading update password page...
        </p>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<UpdatePasswordPageFallback />}>
      <UpdatePasswordPageContent />
    </Suspense>
  );
}
