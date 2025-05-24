"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Loader2 } from "lucide-react";

type AuthError = {
  message: string;
  code?: string;
};

function UpdatePasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [emailForReset, setEmailForReset] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setEmailForReset(email);
          setMessage(`Updating password for ${email}. Please enter your new password.`);
          setError(null);
        })
        .catch((err) => {
          console.error("Firebase verifyPasswordResetCode error:", err);
          let friendlyMessage = "Invalid or expired password reset link.";
          if (err.code === "auth/invalid-action-code") {
            friendlyMessage = "The password reset link is invalid or has expired. Please request a new one.";
          }
          setError(friendlyMessage);
          setMessage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError("No password reset code found. Please use the link from your email.");
      setLoading(false);
    }
  }, [searchParams, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oobCode) {
      setError("Password reset code is missing. Cannot update password.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

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

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?message=Password updated successfully. You can now log in.");
      }, 3000);
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.error("Firebase confirmPasswordReset error:", authError);
      let friendlyMessage = authError.message || "An error occurred while updating your password.";
      if (authError.code === "auth/invalid-action-code") {
        friendlyMessage = "The password reset link is invalid or has expired. Please try again.";
      } else if (authError.code === "auth/user-disabled") {
        friendlyMessage = "This user account has been disabled.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !emailForReset && !error) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="mt-2 text-sm text-gray-500">Verifying password reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">Update Password</h1>
          {emailForReset && !error && (
             <p className="text-sm text-gray-500 mt-2">Create a new password for {emailForReset}</p>
          )}
          {!emailForReset && !error && !loading && (
             <p className="text-sm text-gray-500 mt-2">Enter your new password</p>
          )}
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
            <label htmlFor="password" className="block text-sm font-medium text-accent mb-1">
              New Password
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
        <p className="mt-2 text-sm text-gray-500">Loading update password page...</p>
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