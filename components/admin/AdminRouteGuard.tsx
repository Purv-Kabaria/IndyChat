"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AdminRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminRouteGuard({ 
  children, 
  fallback = (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      <p className="text-secondary">Checking permission...</p>
    </div>
  )
}: AdminRouteGuardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // First check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No session found, redirecting to login");
          router.push('/login?message=You must be logged in to access admin features');
          return;
        }

        console.log("User ID:", session.user.id);
        
        // Check if the user is an admin using the is_user_admin function
        try {
          // Use the is_user_admin RPC function first to bypass RLS
          const { data: isAdminData, error: isAdminError } = await supabase
            .rpc('is_user_admin', { user_id: session.user.id });
          
          if (!isAdminError && isAdminData === true) {
            console.log("User is confirmed admin via RPC function");
            setAuthorized(true);
            setLoading(false);
            return;
          }

          // If RPC failed or returned false, try direct query
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user role:", error);
            setDebugInfo({ type: 'fetch_error', error, userId: session.user.id });
            
            // Show error details instead of trying to create an admin profile
            setLoading(false);
            router.push('/chat?message=You do not have permission to access this area');
            return;
          }
          
          console.log("User profile from database:", data);
          setDebugInfo({ type: 'profile_data', data });
          
          if (!data) {
            console.log("No profile found for user");
            setLoading(false);
            router.push('/chat?message=You do not have permission to access this area');
            return;
          }
          
          // Only authorize if the user has admin role
          if (data.role === 'admin') {
            console.log("User has admin role");
            setAuthorized(true);
          } else {
            console.log("User does not have admin role");
            router.push('/chat?message=You do not have permission to access this area');
          }
          
        } catch (error) {
          console.error("Exception during profile check:", error);
          setDebugInfo({ type: 'check_exception', error });
          router.push('/chat?message=Error checking permissions');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setDebugInfo({ type: 'general_error', error });
        router.push('/login?message=Authentication error');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [router, supabase]);

  // Show loading state while checking
  if (loading) {
    return fallback;
  }

  // Show debugging information if there was an error
  if (debugInfo && !authorized) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Admin Access Debug Information</h1>
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-800 font-medium">Error occurred checking admin permissions</p>
            <p className="text-sm mt-2">This is likely an issue with the profiles table or RLS policies.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md overflow-auto">
            <h2 className="text-lg font-medium mb-2">Error Details</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-80">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Profile
            </button>
            <button 
              onClick={() => router.push('/chat')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only render the children if user is authorized
  return authorized ? <>{children}</> : null;
} 