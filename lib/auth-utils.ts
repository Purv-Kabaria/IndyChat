import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';

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

export async function getUserRole(user?: User | null): Promise<UserRole | null> {
  try {
    if (!user) {
      user = auth.currentUser;
      if (!user) return null;
    }
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return null;
    }
    
    return userDoc.data().role as UserRole;
  } catch (error) {
    console.error('Unexpected error getting user role:', error);
    return null;
  }
}

export async function isAdmin(user?: User | null): Promise<boolean> {
  try {
    if (!user) {
      user = auth.currentUser;
      if (!user) return false;
    }
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return false;
    }
    
    return userDoc.data().role === 'admin';
  } catch (error) {
    console.error('Unexpected error checking admin status:', error);
    return false;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // Check if current user is admin
    const isCurrentUserAdmin = await isAdmin();
    if (!isCurrentUserAdmin) {
      console.error('Only admins can update user roles');
      return false;
    }
    
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { 
      role, 
      updated_at: new Date().toISOString() 
    });
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return false;
  }
}

export async function getAllUsers(): Promise<UserProfile[] | null> {
  try {
    // Check if current user is admin
    const isCurrentUserAdmin = await isAdmin();
    if (!isCurrentUserAdmin) {
      console.error('Only admins can retrieve all users');
      return null;
    }
    
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email || '',
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        avatar_url: userData.avatar_url || null,
        address: userData.address || null,
        role: userData.role || 'user',
        created_at: userData.created_at || '',
        updated_at: userData.updated_at || '',
        last_sign_in_at: userData.last_sign_in_at || null
      });
    });
    
    return users;
  } catch (error) {
    console.error('Unexpected error fetching all users:', error);
    return null;
  }
} 