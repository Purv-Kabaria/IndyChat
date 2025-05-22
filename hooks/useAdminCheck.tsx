import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { isAdmin } from '@/lib/auth-utils';
import { onAuthStateChanged } from 'firebase/auth';

export function useAdminCheck() {
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            setError('No active session found');
            setIsAdminUser(false);
            setLoading(false);
            return;
          }
          
          try {
            const adminStatus = await isAdmin(user);
            setIsAdminUser(adminStatus);
          } catch (err) {
            console.error('Error checking admin status:', err);
            setError('Failed to check admin status');
            setIsAdminUser(false);
          } finally {
            setLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Failed to initialize authentication');
        setIsAdminUser(false);
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  return { isAdminUser, loading, error };
} 