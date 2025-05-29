import {
  Message,
  UploadedFile,
  DifyFileParam,
  Conversation as ConversationType,
} from "@/types/chat";
import { UserProfile } from "@/hooks/useUserProfile";
import { ComplaintType } from "@/functions/complaintUtils";
import {
  createConversation,
  addMessageToConversation,
  updateConversationDifyId,
} from "@/lib/firebase";
import { sendMessageToBackend } from "@/functions/messageUtils";

export interface HandleSubmitLogicParams {
  input: string;
  trimmedInput: string;
  uploadedFiles: UploadedFile[];
  currentUploadedFiles: UploadedFile[];
  userId: string | null;
  profileLoading: boolean;
  currentConversationId: string | null;
  firebaseUserId: string | null;
  profile: UserProfile | null;
  difyConversationId: string | null;
  isTemporaryChat: boolean;
  generateMessageId: () => string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  setConversationsList: React.Dispatch<
    React.SetStateAction<Omit<ConversationType, "messages">[]>
  >;
  setDifyConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  setComplaintType: React.Dispatch<React.SetStateAction<ComplaintType>>;
  setShowComplaintForm: React.Dispatch<React.SetStateAction<boolean>>;
  detectComplaintIntent: (text: string) => ComplaintType | null;
}

export async function handleSubmitLogic(
  params: HandleSubmitLogicParams
): Promise<void> {
  const {
    trimmedInput,
    currentUploadedFiles,
    userId,
    profileLoading,
    currentConversationId,
    firebaseUserId,
    profile,
    difyConversationId,
    isTemporaryChat,
    generateMessageId,
    setIsLoading,
    setMessages,
    setCurrentConversationId,
    setConversationsList,
    setDifyConversationId,
    setComplaintType,
    setShowComplaintForm,
    detectComplaintIntent,
  } = params;

  if (!trimmedInput && currentUploadedFiles.length === 0) return;
  if (!userId || profileLoading) return;

  const complaintIntent = detectComplaintIntent(trimmedInput);
  if (complaintIntent && complaintIntent !== null) {
    setIsLoading(true);
    const userMessageForComplaint: Message = {
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
      id: generateMessageId(),
      attachedFiles: [...currentUploadedFiles],
    };
    setMessages((prevMessages) => [...prevMessages, userMessageForComplaint]);

    let activeFirebaseConvIdForComplaint = currentConversationId;
    if (
      !isTemporaryChat &&
      !activeFirebaseConvIdForComplaint &&
      firebaseUserId &&
      profile?.email
    ) {
      try {
        activeFirebaseConvIdForComplaint = await createConversation(
          firebaseUserId,
          profile.email,
          userMessageForComplaint
        );
        setCurrentConversationId(activeFirebaseConvIdForComplaint);
        setConversationsList((prev) =>
          [
            {
              id: activeFirebaseConvIdForComplaint!,
              user_id: firebaseUserId,
              user_email: profile.email!,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Omit<ConversationType, "messages">,
            ...prev,
          ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        );
      } catch (error) {
        console.error(
          "Error creating Firebase conversation for complaint intent:",
          error
        );
      }
    } else if (
      !isTemporaryChat &&
      activeFirebaseConvIdForComplaint &&
      firebaseUserId
    ) {
      try {
        await addMessageToConversation(
          activeFirebaseConvIdForComplaint,
          userMessageForComplaint
        );
        setConversationsList((prev) =>
          prev
            .map((c) =>
              c.id === activeFirebaseConvIdForComplaint
                ? { ...c, updatedAt: new Date() }
                : c
            )
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        );
      } catch (error) {
        console.error(
          "Error adding complaint intent message to Firebase:",
          error
        );
      }
    }

    setTimeout(() => {
      const assistantResponse: Message = {
        role: "assistant",
        content:
          complaintIntent === "complaint"
            ? "I understand you'd like to file a complaint. Please use the form below."
            : complaintIntent === "report"
            ? "I can help you report this issue. Please use the form below."
            : complaintIntent === "feedback"
            ? "Thank you for your feedback. Please use the form below to submit it formally."
            : "I can help with that. Please use the form below to provide more details.",
        timestamp: new Date(),
        id: generateMessageId(),
      };
      setMessages((prev) => [...prev, assistantResponse]);
      setComplaintType(complaintIntent);
      setShowComplaintForm(true);
      setIsLoading(false);
    }, 700);
    return;
  }

  setIsLoading(true);

  let activeFirebaseConvId = currentConversationId;
  let isNewFirebaseConversation = false;
  let capturedDifyIdForNewChat: string | null = null;
  let firstChunkProcessedForThisCall = false;
  const assistantMessageId = generateMessageId();

  try {
    if (!isTemporaryChat && firebaseUserId && profile?.email) {
      const userMessageForFirebase: Message = {
        role: "user",
        content: trimmedInput,
        timestamp: new Date(),
        id: generateMessageId(),
        attachedFiles: [...currentUploadedFiles],
      };

      if (!activeFirebaseConvId) {
        const newConvId = await createConversation(
          firebaseUserId,
          profile.email,
          userMessageForFirebase
        );
        setCurrentConversationId(newConvId);
        activeFirebaseConvId = newConvId;
        isNewFirebaseConversation = true;
        setConversationsList((prev) =>
          [
            {
              id: newConvId,
              user_id: firebaseUserId,
              user_email: profile.email!,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Omit<ConversationType, "messages">,
            ...prev,
          ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        );
      } else {
        await addMessageToConversation(
          activeFirebaseConvId,
          userMessageForFirebase
        );
        setConversationsList((prev) =>
          prev
            .map((c) =>
              c.id === activeFirebaseConvId
                ? { ...c, updatedAt: new Date() }
                : c
            )
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        );
      }
    }

    const filesToSend: DifyFileParam[] = currentUploadedFiles.map((f) => ({
      type: f.type.startsWith("image") ? "image" : "file",
      transfer_method: "local_file",
      upload_file_id: f.id,
    }));

    let fullAssistantResponse = "";

    const setDifyConversationIdCallback = (
      newDifyIdFromBackend: string | null
    ) => {
      setDifyConversationId(newDifyIdFromBackend);
      if (
        isNewFirebaseConversation &&
        activeFirebaseConvId &&
        newDifyIdFromBackend
      ) {
        capturedDifyIdForNewChat = newDifyIdFromBackend;
      }
    };

    await sendMessageToBackend(
      trimmedInput,
      userId,
      filesToSend,
      difyConversationId,
      generateMessageId,
      setIsLoading,
      setDifyConversationIdCallback,
      (chunk) => {
        if (!firstChunkProcessedForThisCall) {
          setIsLoading(false);
          setMessages((prevMsgs) => [
            ...prevMsgs,
            {
              role: "assistant",
              content: chunk,
              timestamp: new Date(),
              id: assistantMessageId,
            },
          ]);
          fullAssistantResponse = chunk;
          firstChunkProcessedForThisCall = true;
        } else {
          fullAssistantResponse += chunk;
          setMessages((prevMsgs) =>
            prevMsgs.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullAssistantResponse }
                : msg
            )
          );
        }
      }
    );

    if (
      !isTemporaryChat &&
      activeFirebaseConvId &&
      firebaseUserId &&
      fullAssistantResponse
    ) {
      const assistantMessageForFirebase: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: fullAssistantResponse,
        timestamp: new Date(),
      };
      await addMessageToConversation(
        activeFirebaseConvId,
        assistantMessageForFirebase
      );

      setConversationsList((prev) =>
        prev
          .map((c) => {
            if (c.id === activeFirebaseConvId) {
              const updatedConv: Omit<ConversationType, "messages"> = {
                ...c,
                updatedAt: new Date(),
              };
              if (isNewFirebaseConversation && capturedDifyIdForNewChat) {
                updatedConv.difyConversationId = capturedDifyIdForNewChat;
              }
              return updatedConv;
            }
            return c;
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
    }

    if (
      !isTemporaryChat &&
      isNewFirebaseConversation &&
      activeFirebaseConvId &&
      capturedDifyIdForNewChat
    ) {
      try {
        await updateConversationDifyId(
          activeFirebaseConvId,
          capturedDifyIdForNewChat
        );
      } catch (error) {
        console.error(
          "[handleSubmitLogic] Failed to update Firebase conversation with Dify ID:",
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in handleSubmitLogic:", error);
    setIsLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Error: ${
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        }`,
        timestamp: new Date(),
        id: assistantMessageId,
      },
    ]);
  } finally {
    if (!firstChunkProcessedForThisCall) {
      setIsLoading(false);
    }
  }
}
