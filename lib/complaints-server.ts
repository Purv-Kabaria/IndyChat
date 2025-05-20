import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ComplaintType, ComplaintStatus, ComplaintPriority, Complaint } from './complaints';
import type { UserRole } from './auth-utils';

/**
 * Server-side function to get complaints (for server components)
 * This must only be used in server components within the app directory
 */
export async function getComplaintsServer() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }
    
    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileData?.role === 'admin') {
      // Admin can see all complaints
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles!complaints_user_id_fkey(first_name, last_name, email),
          assigned_profiles:profiles!complaints_assigned_to_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } else {
      // Regular users only see their own complaints
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error fetching complaints (server):', error);
    return null;
  }
}

/**
 * Submit a complaint from a server component
 * This must only be used in server components within the app directory
 */
export async function submitComplaintServer(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    // Set default values
    if (!complaint.status) complaint.status = 'open';
    if (!complaint.priority) complaint.priority = 'medium';
    
    const { data, error } = await supabase
      .from('complaints')
      .insert(complaint)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting complaint (server):', error);
    throw error;
  }
} 