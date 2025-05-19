import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isAdmin } from '@/lib/auth-utils';

/**
 * Custom hook to check if the current user has admin permissions
 * Returns isAdmin status, loading state, and an error message if any
 */
export function useAdminCheck() {
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('No active session found');
          setIsAdminUser(false);
          return;
        }
        
        // Check if user is an admin
        const adminStatus = await isAdmin(session);
        setIsAdminUser(adminStatus);
        
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to check admin status');
        setIsAdminUser(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [supabase.auth]);

  return { isAdminUser, loading, error };
} 