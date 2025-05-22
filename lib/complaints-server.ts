import { cookies } from 'next/headers';
import { Complaint } from './complaints';
import { adminAuth, adminDb } from '../app/api/auth/firebase-admin';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Server-side function to get complaints (for server components)
 * This must only be used in server components within the app directory
 */
export async function getComplaintsServer() {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('firebase-auth-token')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie and get the user
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;
    
    // Get the user's profile to check role
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return null;
    }
    
    const userData = userSnap.data();
    
    if (userData?.role === 'admin') {
      // Admin can see all complaints
      const complaintsRef = adminDb.collection('complaints');
      const complaintsSnap = await complaintsRef.orderBy('created_at', 'desc').get();
      
      const complaints: any[] = [];
      
      for (const doc of complaintsSnap.docs) {
        const data = doc.data();
        
        // Get user profile data for the complaint submitter
        let userProfileData = null;
        try {
          const userProfileSnap = await adminDb.collection('users').doc(data.user_id).get();
          if (userProfileSnap.exists) {
            userProfileData = userProfileSnap.data();
          }
        } catch (e) {
          console.error(`Error fetching profile for user ${data.user_id}:`, e);
        }
        
        // Get assigned user profile if any
        let assignedProfileData = null;
        if (data.assigned_to) {
          try {
            const assignedProfileSnap = await adminDb.collection('users').doc(data.assigned_to).get();
            if (assignedProfileSnap.exists) {
              assignedProfileData = assignedProfileSnap.data();
            }
          } catch (e) {
            console.error(`Error fetching profile for assigned user ${data.assigned_to}:`, e);
          }
        }
        
        complaints.push({
          id: doc.id,
          ...data,
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
      // Regular users only see their own complaints
      const complaintsRef = adminDb.collection('complaints');
      const complaintsSnap = await complaintsRef
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();
      
      const complaints: any[] = [];
      
      complaintsSnap.forEach((doc: any) => {
        const data = doc.data();
        complaints.push({
          id: doc.id,
          ...data,
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
 * Submit a complaint from a server component
 * This must only be used in server components within the app directory
 */
export async function submitComplaintServer(complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Set default values
    if (!complaint.status) complaint.status = 'open';
    if (!complaint.priority) complaint.priority = 'medium';
    
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('firebase-auth-token')?.value;
    
    if (!sessionCookie) {
      throw new Error('User must be logged in to submit a complaint');
    }
    
    // Verify the session cookie and get the user
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // If user_id is not provided, use the authenticated user's ID
    if (!complaint.user_id) {
      complaint.user_id = decodedClaims.uid;
    }
    
    // Add the complaint to Firestore
    const complaintRef = adminDb.collection('complaints');
    const docRef = await complaintRef.add({
      ...complaint,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });
    
    // Get the created document
    const docSnap = await docRef.get();
    const data = docSnap.data();
    
    return {
      id: docRef.id,
      ...data,
      created_at: data?.created_at ? data.created_at.toDate().toISOString() : undefined,
      updated_at: data?.updated_at ? data.updated_at.toDate().toISOString() : undefined,
    };
  } catch (error) {
    console.error('Error submitting complaint (server):', error);
    throw error;
  }
} 