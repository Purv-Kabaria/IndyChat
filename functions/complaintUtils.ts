import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  getDoc, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
  FieldValue as ClientFieldValue // Renamed to avoid conflict
} from 'firebase/firestore';
import { getUserProfile } from '@/lib/firebase'; // Assuming this is a client-side utility
import { cookies } from 'next/headers'; // Server-side
import { adminAuth, adminDb } from '@/app/api/auth/firebase-admin'; // Server-side, ensure path is correct
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore'; // Server-side

// Common Types
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
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
  resolved_at?: string | null; // ISO string
  resolution_notes?: string | null;
  assigned_to?: string | null;
}

// Enriched type for admin views (can be used by both client and server)
export interface EnrichedComplaint extends Complaint {
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  assigned_profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

// Client-side functions (from lib/complaints.ts)

/**
 * Submit a new complaint or report (Client-side)
 */
export async function submitComplaint(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>): Promise<Complaint> {
  try {
    // Get current user if user_id not provided
    if (!complaint.user_id) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to submit a complaint');
      }
      complaint.user_id = currentUser.uid;
    }
    
    if (!complaint.status) complaint.status = 'open';
    if (!complaint.priority) complaint.priority = 'medium';
    
    const complaintsRef = collection(db, 'complaints');
    const docRef = await addDoc(complaintsRef, {
      ...complaint,
      created_at: serverTimestamp(), // Uses client-side serverTimestamp
      updated_at: serverTimestamp()  // Uses client-side serverTimestamp
    });
    
    const docSnap = await getDoc(doc(db, 'complaints', docRef.id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docRef.id,
        ...data,
        created_at: data.created_at ? (data.created_at as Timestamp).toDate().toISOString() : undefined,
        updated_at: data.updated_at ? (data.updated_at as Timestamp).toDate().toISOString() : undefined,
      } as Complaint;
    }
    throw new Error('Failed to retrieve the created complaint');
  } catch (error) {
    console.error('Error submitting complaint (client):', error);
    throw error;
  }
}

/**
 * Get complaints for the current user (Client-side)
 */
export async function getUserComplaints(): Promise<Complaint[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to view complaints');
    }
    
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef, 
      where('user_id', '==', currentUser.uid),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const complaints: Complaint[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      complaints.push({
        id: doc.id,
        ...data,
        created_at: data.created_at ? (data.created_at as Timestamp).toDate().toISOString() : undefined,
        updated_at: data.updated_at ? (data.updated_at as Timestamp).toDate().toISOString() : undefined,
      } as Complaint);
    });
    return complaints;
  } catch (error) {
    console.error('Error fetching user complaints (client):', error);
    throw error;
  }
}

/**
 * Get all complaints (Admin only, Client-side)
 * This function uses client-side Firebase SDK and assumes `getUserProfile` is also client-side.
 */
export async function getAllComplaints(): Promise<EnrichedComplaint[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to access complaints');
    }
    
    const userProfile = await getUserProfile(currentUser.uid); // Client-side profile fetch
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can access all complaints');
    }
    
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const complaints: EnrichedComplaint[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      let userProfileData = null;
      try {
        userProfileData = await getUserProfile(data.user_id);
      } catch (e) {
        console.error(`Error fetching profile for user ${data.user_id}:`, e);
      }
      
      let assignedProfileData = null;
      if (data.assigned_to) {
        try {
          assignedProfileData = await getUserProfile(data.assigned_to);
        } catch (e) {
          console.error(`Error fetching profile for assigned user ${data.assigned_to}:`, e);
        }
      }
      
      complaints.push({
        id: docSnapshot.id,
        ...(data as Complaint),
        created_at: data.created_at ? (data.created_at as Timestamp).toDate().toISOString() : undefined,
        updated_at: data.updated_at ? (data.updated_at as Timestamp).toDate().toISOString() : undefined,
        profiles: userProfileData ? {
          first_name: userProfileData.first_name,
          last_name: userProfileData.last_name,
          email: userProfileData.email
        } : null,
        assigned_profiles: assignedProfileData ? {
          first_name: assignedProfileData.first_name,
          last_name: assignedProfileData.last_name
        } : null
      });
    }
    return complaints;
  } catch (error) {
    console.error('Error fetching all complaints (client):', error);
    throw error;
  }
}

/**
 * Update complaint status (Admin only, Client-side)
 */
export async function updateComplaintStatus(
  complaintId: string, 
  status: ComplaintStatus, 
  resolutionNotes?: string,
  priority?: ComplaintPriority
): Promise<Complaint> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to update complaints');
    }
    
    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can update complaint status');
    }
    
    const complaintRef = doc(db, 'complaints', complaintId);
    const updateData: {
      status: ComplaintStatus;
      updated_at: ClientFieldValue; // Client-side FieldValue
      resolved_at?: string;
      resolution_notes?: string;
      priority?: ComplaintPriority;
    } = { 
      status, 
      updated_at: serverTimestamp() // Client-side serverTimestamp
    };
    
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
    if (priority) updateData.priority = priority;
    
    await updateDoc(complaintRef, updateData);
    const updatedDoc = await getDoc(complaintRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: complaintId,
        ...data,
        created_at: data.created_at ? (data.created_at as Timestamp).toDate().toISOString() : undefined,
        updated_at: data.updated_at ? (data.updated_at as Timestamp).toDate().toISOString() : undefined,
      } as Complaint;
    }
    throw new Error('Failed to retrieve the updated complaint');
  } catch (error) {
    console.error('Error updating complaint status (client):', error);
    throw error;
  }
}

/**
 * Assign complaint to staff member (Admin only, Client-side)
 */
export async function assignComplaint(complaintId: string, staffUserId: string): Promise<Complaint> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to assign complaints');
    }
    
    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can assign complaints');
    }
    
    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, { 
      assigned_to: staffUserId,
      updated_at: serverTimestamp() // Client-side serverTimestamp
    });
    
    const updatedDoc = await getDoc(complaintRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: complaintId,
        ...data,
        created_at: data.created_at ? (data.created_at as Timestamp).toDate().toISOString() : undefined,
        updated_at: data.updated_at ? (data.updated_at as Timestamp).toDate().toISOString() : undefined,
      } as Complaint;
    }
    throw new Error('Failed to retrieve the updated complaint');
  } catch (error) {
    console.error('Error assigning complaint (client):', error);
    throw error;
  }
}

/**
 * Delete complaint (Admin only, Client-side)
 */
export async function deleteComplaint(complaintId: string): Promise<{ success: true, id: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to delete complaints');
    }
    
    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only admins can delete complaints');
    }
    
    const complaintRef = doc(db, 'complaints', complaintId);
    const complaintDoc = await getDoc(complaintRef);
    if (!complaintDoc.exists()) {
      throw new Error('Complaint not found');
    }
    
    await deleteDoc(complaintRef);
    return { success: true, id: complaintId };
  } catch (error) {
    console.error('Error deleting complaint (client):', error);
    throw error;
  }
} 

// Server-side functions (from lib/complaints-server.ts)

/**
 * Server-side function to get complaints (for server components)
 * This must only be used in server components within the app directory.
 * It requires `cookies` from `next/headers` and Firebase Admin SDK.
 */
export async function getComplaintsServer(): Promise<EnrichedComplaint[] | Complaint[] | null> {
  try {
    const cookieStore = await cookies(); // Server-side
    const sessionCookie = cookieStore.get('firebase-auth-token')?.value;
    
    if (!sessionCookie) return null;
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true); // Server-side
    const userId = decodedClaims.uid;
    
    const userRef = adminDb.collection('users').doc(userId); // Server-side
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return null;
    const userData = userSnap.data();
    
    if (userData?.role === 'admin') {
      const complaintsRef = adminDb.collection('complaints'); // Server-side
      const complaintsSnap = await complaintsRef.orderBy('created_at', 'desc').get();
      const complaints: EnrichedComplaint[] = [];
      
      for (const docSnapshot of complaintsSnap.docs) {
        const data = docSnapshot.data();
        let userProfileData = null;
        try {
          const userProfileSnap = await adminDb.collection('users').doc(data.user_id).get(); // Server-side
          if (userProfileSnap.exists) userProfileData = userProfileSnap.data();
        } catch (e) {
          console.error(`Error fetching profile for user ${data.user_id} (server):`, e);
        }
        
        let assignedProfileData = null;
        if (data.assigned_to) {
          try {
            const assignedProfileSnap = await adminDb.collection('users').doc(data.assigned_to).get(); // Server-side
            if (assignedProfileSnap.exists) assignedProfileData = assignedProfileSnap.data();
          } catch (e) {
            console.error(`Error fetching profile for assigned user ${data.assigned_to} (server):`, e);
          }
        }
        
        complaints.push({
          id: docSnapshot.id,
          ...(data as Complaint),
          created_at: data.created_at ? data.created_at.toDate().toISOString() : undefined,
          updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined,
          profiles: userProfileData ? {
            first_name: userProfileData.first_name,
            last_name: userProfileData.last_name,
            email: userProfileData.email
          } : null,
          assigned_profiles: assignedProfileData ? {
            first_name: assignedProfileData.first_name,
            last_name: assignedProfileData.last_name
          } : null
        });
      }
      return complaints;
    } else {
      const complaintsRef = adminDb.collection('complaints'); // Server-side
      const complaintsSnap = await complaintsRef
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();
      const complaints: Complaint[] = [];
      complaintsSnap.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        complaints.push({
          id: docSnapshot.id,
          ...(data as Complaint),
          created_at: data.created_at ? data.created_at.toDate().toISOString() : undefined,
          updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined,
        });
      });
      return complaints;
    }
  } catch (error) {
    console.error('Error fetching complaints (server):', error);
    return null;
  }
}

/**
 * Submit a complaint from a server component (Server-side)
 * This must only be used in server components within the app directory.
 * It requires `cookies` from `next/headers` and Firebase Admin SDK.
 */
export async function submitComplaintServer(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>): Promise<Complaint | null> {
  try {
    if (!complaint.status) complaint.status = 'open';
    if (!complaint.priority) complaint.priority = 'medium';
    
    const cookieStore = await cookies(); // Server-side
    const sessionCookie = cookieStore.get('firebase-auth-token')?.value;
    
    if (!sessionCookie) {
      throw new Error('User must be logged in to submit a complaint (server)');
    }
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true); // Server-side
    if (!complaint.user_id) {
      complaint.user_id = decodedClaims.uid;
    }
    
    const complaintRef = adminDb.collection('complaints'); // Server-side
    const docRef = await complaintRef.add({
      ...complaint,
      created_at: AdminFieldValue.serverTimestamp(), // Admin SDK serverTimestamp
      updated_at: AdminFieldValue.serverTimestamp()  // Admin SDK serverTimestamp
    });
    
    const docSnap = await docRef.get();
    const data = docSnap.data();
    if (data) {
      return {
        id: docRef.id,
        ...data,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : undefined,
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : undefined,
      } as Complaint;
    }
    return null; // Should ideally not happen if addDoc was successful
  } catch (error) {
    console.error('Error submitting complaint (server):', error);
    throw error; // Re-throw to be handled by the caller
  }
} 