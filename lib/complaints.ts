import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type ComplaintType = 'complaint' | 'report' | 'feedback' | 'suggestion';
export type ComplaintStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id?: string;
  user_id: string;
  type: ComplaintType;
  subject: string;
  description: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  assigned_to?: string | null;
}

/**
 * Submit a new complaint or report
 */
export async function submitComplaint(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClientComponentClient();
  
  try {
    // Get current user if user_id not provided
    if (!complaint.user_id) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User must be logged in to submit a complaint');
      }
      complaint.user_id = session.user.id;
    }
    
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
    console.error('Error submitting complaint:', error);
    throw error;
  }
}

/**
 * Get complaints for the current user
 */
export async function getUserComplaints() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to view complaints');
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    throw error;
  }
}

/**
 * Get all complaints (admin only)
 */
export async function getAllComplaints() {
  const supabase = createClientComponentClient();
  
  try {
    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (!profileData || profileData.role !== 'admin') {
      throw new Error('Only admins can access all complaints');
    }
    
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
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    throw error;
  }
}

/**
 * Update complaint status (admin only)
 */
export async function updateComplaintStatus(
  complaintId: string, 
  status: ComplaintStatus, 
  resolutionNotes?: string
) {
  const supabase = createClientComponentClient();
  
  try {
    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (!profileData || profileData.role !== 'admin') {
      throw new Error('Only admins can update complaint status');
    }
    
    const updateData: {
      status: ComplaintStatus;
      updated_at: string;
      resolved_at?: string;
      resolution_notes?: string;
    } = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    // If resolving the complaint, add resolution timestamp
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    
    // Add resolution notes if provided
    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
}

/**
 * Assign complaint to staff member (admin only)
 */
export async function assignComplaint(complaintId: string, staffUserId: string) {
  const supabase = createClientComponentClient();
  
  try {
    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (!profileData || profileData.role !== 'admin') {
      throw new Error('Only admins can assign complaints');
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .update({ 
        assigned_to: staffUserId,
        updated_at: new Date().toISOString() 
      })
      .eq('id', complaintId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
} 