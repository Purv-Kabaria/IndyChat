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
  FieldValue as ClientFieldValue,
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
  location?: string;
  image_urls?: string[];
}

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

export async function submitComplaint(
  complaint: Omit<Complaint, "id" | "created_at" | "updated_at"> & {
    images?: FileList | null;
  }
): Promise<Complaint> {
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

    const { images, ...complaintData } = complaint;

    const imageUrls: string[] = [];

    if (images && images.length > 0) {
      // Cloudinary details - REMINDER: User provided these.
      const cloudName = "dtb5nuv3m";
      const uploadPreset = "indychat";

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        try {
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );
          const data = await response.json();
          if (data.secure_url) {
            imageUrls.push(data.secure_url);
          } else {
            console.warn(
              "Cloudinary upload failed for a file, no secure_url:",
              data
            );
            // Optionally, throw an error here or handle it more gracefully
          }
        } catch (uploadError) {
          console.error("Error uploading image to Cloudinary:", uploadError);
          // Optionally, re-throw or collect errors to inform the user
          // For simplicity, we'll continue trying to upload other images
        }
      }
    }

    const docRef = await addDoc(complaintsRef, {
      ...complaintData,
      image_urls: imageUrls,
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
    console.error("Error submitting complaint (client):", error);
    throw error;
  }
}

export async function getUserComplaints(): Promise<Complaint[]> {
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
    console.error("Error fetching user complaints (client):", error);
    throw error;
  }
}

export async function getAllComplaints(): Promise<EnrichedComplaint[]> {
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
          console.error(
            `Error fetching profile for assigned user ${data.assigned_to}:`,
            e
          );
        }
      }

      complaints.push({
        id: docSnapshot.id,
        ...(data as Complaint),
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
    console.error("Error fetching all complaints (client):", error);
    throw error;
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  resolutionNotes?: string,
  priority?: ComplaintPriority
): Promise<Complaint> {
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
      updated_at: ClientFieldValue;
      resolved_at?: string;
      resolution_notes?: string;
      priority?: ComplaintPriority;
    } = {
      status,
      updated_at: serverTimestamp(),
    };

    if (status === "resolved")
      updateData.resolved_at = new Date().toISOString();
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
    if (priority) updateData.priority = priority;

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
    console.error("Error updating complaint status (client):", error);
    throw error;
  }
}

export async function assignComplaint(
  complaintId: string,
  staffUserId: string
): Promise<Complaint> {
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
    console.error("Error assigning complaint (client):", error);
    throw error;
  }
}

export async function deleteComplaint(
  complaintId: string
): Promise<{ success: true; id: string }> {
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
    console.error("Error deleting complaint (client):", error);
    throw error;
  }
}
