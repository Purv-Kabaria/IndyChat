"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup"
      });

      if (error) throw error;
      
      setMessage("Email verified successfully!");
      
      // Redirect after successful verification
      setTimeout(() => {
        router.push("/login?message=Account verified successfully. You can now log in.");
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email is required to resend verification code");
      return;
    }
    
    setResending(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email
      });
      
      if (error) throw error;
      
      setMessage("A new verification code has been sent to your email");
    } catch (error: any) {
      setError(error.message || "Failed to resend verification code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cal font-bold text-accent">Verify Email</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter the verification code sent to{" "}
            <span className="font-medium">{email || "your email"}</span>
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

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-accent mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter your 6-digit code"
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
            Verify Email
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Didn't receive a code?{" "}
            <button 
              onClick={handleResendOTP}
              disabled={resending}
              className="text-accent hover:underline font-medium disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-accent hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
} 