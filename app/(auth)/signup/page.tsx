"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Home, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";
import { createUser, signInWithGoogle, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type AuthError = {
  message: string;
  code?: string;
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAuthStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const forceRedirect = urlParams.get("forceRedirect");

      try {
        if (signupSuccess) {
          setSessionChecked(true);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && forceRedirect !== "false" && !signupSuccess) {
            router.push("/chat");
            return;
          }

          setSessionChecked(true);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Unexpected error during session check:", err);
        setSessionChecked(true);
      }
    };

    checkAuthStatus();
  }, [router, signupSuccess]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const result = await createUser(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: "user",
      });

      if (result.user) {
        // Store the email and show success message instead of redirecting
        setUserEmail(email);
        setSignupSuccess(true);
      }
    } catch (error: unknown) {
      console.error("Signup error:", error);

      const authError = error as AuthError;

      if (authError.code === "auth/email-already-in-use") {
        setError(
          "This email is already registered. Please try logging in instead."
        );
      } else if (authError.code === "auth/invalid-email") {
        setError(
          "Invalid email format. Please check your email and try again."
        );
      } else if (authError.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (authError.code === "auth/network-request-failed") {
        setError(
          "Network error. Please check your internet connection and try again."
        );
      } else {
        setError(authError.message || "An error occurred during signup");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error("Google sign in error:", error);
      const authError = error as AuthError;
      setError(authError.message || "An error occurred with Google sign in");
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-cal font-bold text-accent">Success!</h1>
            <p className="text-sm text-gray-500 mt-2">Your account has been created</p>
          </div>

          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6">
            <div className="flex items-center mb-3">
              <Mail className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="font-semibold text-lg">Please verify your email</h2>
            </div>
            <p className="mb-3">
              We&apos;ve sent a verification link to: <br />
              <span className="font-medium">{userEmail}</span>
            </p>
            <p className="text-sm">
              Check your inbox (and spam folder) and click the verification link to activate your account.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push(`/verify?email=${encodeURIComponent(userEmail)}`)}
              className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors">
              Go to Verification Page
            </button>
            
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-md font-medium transition-colors">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white py-2 px-3 rounded-lg text-sm">
        <Home className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">IndyChat</h1>
          <p className="text-sm text-gray-500 mt-2">Create a new account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-accent mb-1">
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
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-accent mb-1">
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
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-accent mb-1">
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
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
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

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-2 rounded-md font-medium transition-colors">
              <Image
                src="/images/google-logo.svg"
                alt="Google logo"
                width={18}
                height={18}
              />
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign up with Google"
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

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