import { auth, db } from "@/lib/firebase";
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
} from "firebase/firestore";
import { getUserProfile } from "@/lib/firebase";

export type ComplaintType = "complaint" | "report" | "feedback" | "suggestion";
export type ComplaintStatus = "open" | "under_review" | "resolved" | "closed";
export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

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

export async function submitComplaint(
  complaint: Omit<Complaint, "id" | "created_at" | "updated_at">
) {
  try {
    if (!complaint.user_id) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be logged in to submit a complaint");
      }
      complaint.user_id = currentUser.uid;
    }

    if (!complaint.status) complaint.status = "open";
    if (!complaint.priority) complaint.priority = "medium";

    const complaintsRef = collection(db, "complaints");
    const docRef = await addDoc(complaintsRef, {
      ...complaint,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const docSnap = await getDoc(doc(db, "complaints", docRef.id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docRef.id,
        ...data,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Complaint;
    }

    throw new Error("Failed to retrieve the created complaint");
  } catch (error) {
    console.error("Error submitting complaint:", error);
    throw error;
  }
}

export async function getUserComplaints() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to view complaints");
    }

    const complaintsRef = collection(db, "complaints");
    const q = query(
      complaintsRef,
      where("user_id", "==", currentUser.uid),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    const complaints: Complaint[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      complaints.push({
        id: doc.id,
        ...data,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Complaint);
    });

    return complaints;
  } catch (error) {
    console.error("Error fetching user complaints:", error);
    throw error;
  }
}

export async function getAllComplaints() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to access complaints");
    }

    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only admins can access all complaints");
    }

    const complaintsRef = collection(db, "complaints");
    const q = query(complaintsRef, orderBy("created_at", "desc"));

    const querySnapshot = await getDocs(q);
    const complaints: any[] = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();

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
          console.error(
            `Error fetching profile for assigned user ${data.assigned_to}:`,
            e
          );
        }
      }

      complaints.push({
        id: doc.id,
        ...data,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
        profiles: userProfileData
          ? {
              first_name: userProfileData.first_name,
              last_name: userProfileData.last_name,
              email: userProfileData.email,
            }
          : null,
        assigned_profiles: assignedProfileData
          ? {
              first_name: assignedProfileData.first_name,
              last_name: assignedProfileData.last_name,
            }
          : null,
      });
    }

    return complaints;
  } catch (error) {
    console.error("Error fetching all complaints:", error);
    throw error;
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  resolutionNotes?: string,
  priority?: ComplaintPriority
) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to update complaints");
    }

    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only admins can update complaint status");
    }

    const complaintRef = doc(db, "complaints", complaintId);

    const updateData: {
      status: ComplaintStatus;
      updated_at: any;
      resolved_at?: string;
      resolution_notes?: string;
      priority?: ComplaintPriority;
    } = {
      status,
      updated_at: serverTimestamp(),
    };

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }

    if (priority) {
      updateData.priority = priority;
    }

    await updateDoc(complaintRef, updateData);

    const updatedDoc = await getDoc(complaintRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: complaintId,
        ...data,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Complaint;
    }

    throw new Error("Failed to retrieve the updated complaint");
  } catch (error) {
    console.error("Error updating complaint status:", error);
    throw error;
  }
}

export async function assignComplaint(
  complaintId: string,
  staffUserId: string
) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to assign complaints");
    }

    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only admins can assign complaints");
    }

    const complaintRef = doc(db, "complaints", complaintId);

    await updateDoc(complaintRef, {
      assigned_to: staffUserId,
      updated_at: serverTimestamp(),
    });

    const updatedDoc = await getDoc(complaintRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      return {
        id: complaintId,
        ...data,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Complaint;
    }

    throw new Error("Failed to retrieve the updated complaint");
  } catch (error) {
    console.error("Error assigning complaint:", error);
    throw error;
  }
}

export async function deleteComplaint(complaintId: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to delete complaints");
    }

    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Only admins can delete complaints");
    }

    const complaintRef = doc(db, "complaints", complaintId);

    const complaintDoc = await getDoc(complaintRef);
    if (!complaintDoc.exists()) {
      throw new Error("Complaint not found");
    }

    await deleteDoc(complaintRef);

    return { success: true, id: complaintId };
  } catch (error) {
    console.error("Error deleting complaint:", error);
    throw error;
  }
}
