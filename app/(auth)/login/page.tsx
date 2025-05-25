"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Home } from "lucide-react";
import Image from "next/image";
import { signIn, signInWithGoogle, getUserProfile } from '@/lib/firebase';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(message);

  type AuthError = {
    message: string;
    code?: string;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await signIn(email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Your email is not verified. Please check your inbox for a verification link or request a new one on the verification page.");
        router.push(`/verify?email=${user.email}&message=Please verify your email to log in.`);
        setLoading(false);
        return;
      }
      
      const profile = await getUserProfile(user.uid);
      
      if (!profile) {
        router.push("/chat");
        return;
      }
      
      if (profile.role === 'admin') {
        router.push("/admin/users");
        return;
      }
      
      router.push("/chat");
    } catch (error: unknown) {
      const authError = error as AuthError;
      
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else if (authError.code === 'auth/too-many-requests') {
        setError('Too many unsuccessful login attempts. Please try again later.');
      } else if (authError.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError(authError.message || "An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const authError = error as AuthError;
      setError(authError.message || "An error occurred with Google sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white py-2 px-3 rounded-lg text-sm">
        <Home className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">IndyChat</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-accent mb-1">
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
            <label htmlFor="password" className="block text-sm font-medium text-accent mb-1">
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

          <div className="flex items-center justify-end">
            <Link href="/reset-password" className="text-sm text-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Sign In
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

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md p-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Image src="/images/google.svg" alt="Google" width={20} height={20} />
            Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-dark via-accent to-highlight/90 px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-2 text-sm text-gray-500">Loading login page...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
} 