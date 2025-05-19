import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin';

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  address: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
};

export async function getUserRole(session?: Session | null): Promise<UserRole | null> {
  const supabase = createClientComponentClient();
  
  try {
    if (!session) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) return null;
      session = currentSession;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data.role as UserRole;
  } catch (error) {
    console.error('Unexpected error getting user role:', error);
    return null;
  }
}

export async function isAdmin(session?: Session | null): Promise<boolean> {
  const supabase = createClientComponentClient();
  
  try {
    if (!session) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) return false;
      session = currentSession;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Unexpected error checking admin status:', error);
    return false;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = createClientComponentClient();
  
  try {
    const currentUserRole = await getUserRole();
    if (currentUserRole !== 'admin') {
      console.error('Only admins can update user roles');
      return false;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return false;
  }
}

export async function getAllUsers(): Promise<UserProfile[] | null> {
  const supabase = createClientComponentClient();
  
  try {
    const currentUserRole = await getUserRole();
    if (currentUserRole !== 'admin') {
      console.error('Only admins can retrieve all users');
      return null;
    }
    
    // Get users directly from the profiles table - we've updated the profile page
    // to ensure that user data is saved to both auth metadata and the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all users:', error);
      return null;
    }
    
    return data as UserProfile[];
  } catch (error) {
    console.error('Unexpected error fetching all users:', error);
    return null;
  }
} 