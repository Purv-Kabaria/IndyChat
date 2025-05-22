"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { sendPasswordReset } from "@/lib/firebase";
import { AuthError } from "firebase/auth";

type FirebaseError = {
  code?: string;
  message: string;
};

function ResetPasswordPageContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const result = await sendPasswordReset(email);

      if (result.error) {
        throw result.error;
      }

      setMessage("Check your email for a password reset link");
    } catch (error: unknown) {
      const authError = error as FirebaseError;

      let errorMessage =
        "An error occurred while sending the password reset email";

      if (authError.code === "auth/user-not-found") {
        setMessage(
          "If this email is registered, you'll receive a password reset link"
        );
      } else if (authError.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (authError.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      } else {
        console.error("Password reset error:", authError);
      }

      if (authError.code !== "auth/user-not-found") {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email to receive a reset link
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

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-accent mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              aria-describedby="email-description"
            />
            <p id="email-description" className="mt-1 text-xs text-gray-500">
              Enter the email address associated with your account
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Send Reset Link
          </button>
        </form>

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

function ResetPasswordPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">
          Loading reset password page...
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
