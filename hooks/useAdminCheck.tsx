import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isAdmin } from '@/lib/auth-utils';

export function useAdminCheck() {
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('No active session found');
          setIsAdminUser(false);
          return;
        }
        
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