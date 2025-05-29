import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, getConversationsForUser } from "@/lib/firebase";
import { Conversation as ConversationType, Message } from "@/types/chat";
import { UserProfile } from "@/hooks/useUserProfile";

export interface AuthAndConversationsState {
  userId: string | null;
  firebaseUserId: string | null;
  conversationsList: Omit<ConversationType, "messages">[];
  isLoadingConversations: boolean;
  profile: UserProfile | null;
}

interface UseAuthAndConversationsProps {
  profile: UserProfile | null;
  profileLoading: boolean;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  setFirebaseUserId: React.Dispatch<React.SetStateAction<string | null>>;
  setConversationsList: React.Dispatch<
    React.SetStateAction<Omit<ConversationType, "messages">[]>
  >;
  setIsLoadingConversations: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useAuthAndConversations({
  profile,
  profileLoading,
  setUserId,
  setFirebaseUserId,
  setConversationsList,
  setIsLoadingConversations,
  setCurrentConversationId,
}: UseAuthAndConversationsProps): void {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (user && profile && !profileLoading) {
          setFirebaseUserId(user.uid);
          setUserId(user.uid);
          if (profile.id) {
            setIsLoadingConversations(true);
            try {
              const convos = await getConversationsForUser(profile.id);
              setConversationsList(convos);
            } catch (error) {
              console.error("Error fetching conversations:", error);
              setConversationsList([]);
            } finally {
              setIsLoadingConversations(false);
            }
          }
        } else if (!user && !profileLoading) {
          setFirebaseUserId(null);
          let guestDifyUserId = localStorage.getItem("difyGuestUserId");
          if (!guestDifyUserId) {
            guestDifyUserId = `guest-web-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("difyGuestUserId", guestDifyUserId);
          }
          setUserId(guestDifyUserId);
          setConversationsList([]);
          setCurrentConversationId(null);
          setIsLoadingConversations(false);
        }
      }
    );
    return () => unsubscribe();
  }, [
    profile,
    profileLoading,
    setUserId,
    setFirebaseUserId,
    setConversationsList,
    setIsLoadingConversations,
    setCurrentConversationId,
  ]);
}
