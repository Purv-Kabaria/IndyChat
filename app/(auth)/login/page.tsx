"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Home } from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const supabase = createClientComponentClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(message);

type AuthError = {
  message: string;
};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if this is an email verification error
        if (error.message.includes("Email not confirmed")) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        throw error;
      }

      // Ensure the user has a profile in the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user?.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // First check if this user has admin privileges in auth metadata
        const { data: userRoleData, error: roleError } = await supabase.auth.getUser();
        
        // Determine if the user should have admin role from metadata or previous setup
        const shouldBeAdmin = userRoleData?.user?.app_metadata?.role === 'admin';
        
        // Profile doesn't exist yet, create it with appropriate role
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: loginData.user?.id,
            email: loginData.user?.email,
            first_name: loginData.user?.user_metadata?.first_name || '',
            last_name: loginData.user?.user_metadata?.last_name || '',
            avatar_url: loginData.user?.user_metadata?.avatar_url || null,
            role: shouldBeAdmin ? 'admin' : 'user'
          });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
        }
        
        // If user should be admin, redirect to admin page
        if (shouldBeAdmin) {
          router.push("/admin");
          return;
        }
      } else if (profileData) {
        // Profile exists, update last sign-in timestamp
        await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', loginData.user?.id);
        
        // Redirect based on role
        if (profileData.role === 'admin') {
          router.push("/admin");
          return;
        }
      }

      // Default redirect to chat
      router.push("/chat");
    } catch (error: unknown) {
      setError((error as AuthError).message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError((error as AuthError).message || "An error occurred with Google sign in");
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

// Loading fallback component
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