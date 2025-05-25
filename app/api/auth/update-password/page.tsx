"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function UpdatePasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedActionCode, setVerifiedActionCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (oobCode) {
      setActionCode(oobCode);
      setVerifyingCode(true);
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setMessage(`Updating password for ${email}. Please enter your new password.`);
          setVerifiedActionCode(true);
        })
        .catch((err) => {
          const firebaseError = err as { code?: string; message?: string };
          setError(firebaseError.message || "Invalid or expired password reset link. Please try resetting your password again.");
        }).finally(() => {
          setVerifyingCode(false);
        });
    } else {
      setError("No password reset code provided. Please use the link from your email.");
      setVerifyingCode(false);
    }
  }, [searchParams, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verifiedActionCode || !actionCode) {
      setError("Password reset code is missing or invalid. Please verify the link again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await confirmPasswordReset(auth, actionCode, password);
      setMessage("Password updated successfully. You can now log in with your new password.");
      setTimeout(() => {
        router.push("/login?message=Password updated successfully");
      }, 3000);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      setError(firebaseError.message || "An error occurred while updating your password.");
    } finally {
      setLoading(false);
    }
  };
  
  if (verifyingCode) {
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
          {!error && !message && <p className="text-sm text-gray-500 mt-2">Create a new password for your account</p>}
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

        {verifiedActionCode && !message && !error && (
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
        )}
        {(error || (message && !error)) && (
           <p className="mt-6 text-center text-sm text-gray-500">
             <Link href="/login" className="text-accent hover:underline font-medium">
               Back to login
             </Link>
           </p>
        )}
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