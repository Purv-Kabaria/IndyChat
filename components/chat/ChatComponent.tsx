"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send,
  MenuIcon,
  Loader2,
  Paperclip,
  X,
  File as FileIcon,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { extractIframes, createSafeIframe } from "@/functions/iframeUtils";
import { sendMessageToBackend } from "@/functions/messageUtils";
import { uploadFile } from "@/functions/uploadUtils";
import {
  Message,
  UploadedFile,
  DifyFileParam,
  Conversation as ConversationType,
} from "@/types/chat";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TTSButton } from "@/components/ui/TTSButton";
import { STTButton } from "@/components/ui/STTButton";
import {
  auth,
  createConversation,
  addMessageToConversation,
  getConversationsForUser,
  getConversationWithMessages,
  updateConversationDifyId,
  deleteConversation,
} from "@/lib/firebase";
import ChatSidebar from "./ChatSidebar";
import { ComplaintMessage } from "./ComplaintMessage";
import { ComplaintType } from "@/functions/complaintUtils";
import { onAuthStateChanged } from "firebase/auth";
import { UserRole } from "@/lib/auth-utils";
import { toast } from "@/components/ui/use-toast";
import {
  handleSubmitLogic,
  HandleSubmitLogicParams,
} from "@/functions/chatSubmitHandler";
import { MessageContent } from "./MessageContent";
import { useAuthAndConversations } from "@/hooks/useAuthAndConversations";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0 },
};

const extractMessageContent = (content: string): string => {
  if (!content || typeof content !== "string") return "";

  if (content.trim().startsWith("{") && content.includes('"action_input"')) {
    try {
      const jsonContent = JSON.parse(content);
      if (jsonContent.action_input) {
        return jsonContent.action_input;
      }
    } catch {}
  }
  return content;
};

export default function ChatComponent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounterRef = useRef(0);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversationsList, setConversationsList] = useState<
    Omit<ConversationType, "messages">[]
  >([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasInitializedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const { profile, loading: profileLoading } = useUserProfile();
  const [userRole, setUserRole] = useState<UserRole | "guest" | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintType, setComplaintType] =
    useState<ComplaintType>("complaint");
  const [difyConversationId, setDifyConversationId] = useState<string | null>(
    null
  );
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const generateMessageId = useCallback(() => {
    const counter = messageIdCounterRef.current;
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${counter}`;
  }, []);

  useAuthAndConversations({
    profile,
    profileLoading,
    setUserId,
    setFirebaseUserId,
    setConversationsList,
    setIsLoadingConversations,
    setCurrentConversationId,
  });

  const detectComplaintIntent = (messageText: string): ComplaintType | null => {
    const lowerCaseMessage = messageText.toLowerCase();
    if (
      lowerCaseMessage.includes("file a complaint") ||
      lowerCaseMessage.includes("formal complaint")
    ) {
      return "complaint";
    }
    if (
      lowerCaseMessage.includes("report issue") ||
      lowerCaseMessage.includes("problem with")
    ) {
      return "report";
    }
    return null;
  };

  const handleSelectConversation = useCallback(
    async (conversationIdToLoad: string) => {
      if (!profile?.id) return;
      setIsLoading(true);
      setMessages([]);
      setDifyConversationId(null);
      setIsTemporaryChat(false);
      try {
        const conversation = await getConversationWithMessages(
          conversationIdToLoad
        );
        if (conversation) {
          setCurrentConversationId(conversation.id);
          const loadedMessages: Message[] = conversation.messages.map(
            (emsg) => ({
              id: emsg.id,
              role: emsg.role,
              content: emsg.message,
              timestamp: emsg.date,
              attachedFiles: emsg.attachedFiles,
            })
          );
          setMessages(loadedMessages);

          if (conversation.difyConversationId) {
            setDifyConversationId(conversation.difyConversationId);
          } else {
            setDifyConversationId(null);
          }
        } else {
          setCurrentConversationId(null);
          setDifyConversationId(null);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        setCurrentConversationId(null);
        setDifyConversationId(null);
      } finally {
        setIsLoading(false);
        setSidebarOpen(false);
      }
    },
    [profile?.id]
  );

  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setDifyConversationId(null);
    setInput("");
    setUploadedFiles([]);
    setIsTemporaryChat(false);
    if (textareaRef.current) textareaRef.current.focus();
    setSidebarOpen(false);
  }, []);

  const startNewTemporaryChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setDifyConversationId(null);
    setInput("");
    setUploadedFiles([]);
    setIsTemporaryChat(true);
    if (textareaRef.current) textareaRef.current.focus();
    setSidebarOpen(false);
    toast({
      title: "Temporary Chat Started",
      description: "This chat will not be saved to your history.",
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitializedRef.current && userId) {
      hasInitializedRef.current = true;
      const promptParam = searchParams.get("prompt");
      if (messages.length === 0 && promptParam) {
        const initialUserMessage: Message = {
          role: "user",
          content: promptParam,
          timestamp: new Date(),
          id: generateMessageId(),
        };
        setMessages([initialUserMessage]);
      }
    }
  }, [searchParams, userId, messages.length, generateMessageId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    async (
      e?:
        | React.FormEvent<HTMLFormElement>
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e) e.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput && uploadedFiles.length === 0) return;
      if (!userId || profileLoading) return;

      const complaintIntent = detectComplaintIntent(trimmedInput);

      if (complaintIntent) {
        const userMessageForComplaint: Message = {
          role: "user",
          content: trimmedInput,
          timestamp: new Date(),
          id: generateMessageId(),
          attachedFiles: [...uploadedFiles],
        };
        setMessages((prevMessages) => [
          ...prevMessages,
          userMessageForComplaint,
        ]);
        setInput("");
        const currentUploadedFilesForComplaint = [...uploadedFiles];
        setUploadedFiles([]);

        await handleSubmitLogic({
          input,
          trimmedInput,
          uploadedFiles,
          currentUploadedFiles: currentUploadedFilesForComplaint,
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
          setInput,
          setUploadedFiles,
          setCurrentConversationId,
          setConversationsList,
          setDifyConversationId,
          setComplaintType,
          setShowComplaintForm,
          detectComplaintIntent,
        });
        return;
      }

      const userMessage: Message = {
        role: "user",
        content: trimmedInput,
        timestamp: new Date(),
        id: generateMessageId(),
        attachedFiles: [...uploadedFiles],
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      const currentUploadedFiles = [...uploadedFiles];
      setUploadedFiles([]);

      await handleSubmitLogic({
        input,
        trimmedInput,
        uploadedFiles,
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
        setInput,
        setUploadedFiles,
        setCurrentConversationId,
        setConversationsList,
        setDifyConversationId,
        setComplaintType,
        setShowComplaintForm,
        detectComplaintIntent,
      });
    },
    [
      input,
      uploadedFiles,
      userId,
      profileLoading,
      currentConversationId,
      firebaseUserId,
      profile,
      difyConversationId,
      generateMessageId,
      setDifyConversationId,
      isTemporaryChat,
      setMessages,
      setInput,
      setUploadedFiles,
      setCurrentConversationId,
      setConversationsList,
      setComplaintType,
      setShowComplaintForm,
      detectComplaintIntent,
      setIsLoading,
    ]
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId) return;

    setIsUploading(true);
    const uploadPromises: Promise<UploadedFile | null>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (max 15MB).`);
        continue;
      }
      uploadPromises.push(uploadFile(file, userId));
    }

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(
        (result): result is UploadedFile => result !== null
      );
      setUploadedFiles((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const newFiles = successfulUploads.filter(
          (f) => !existingIds.has(f.id)
        );
        return [...prev, ...newFiles];
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Some files could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileIdToRemove: string) => {
    setUploadedFiles((prev) =>
      prev.filter((file) => file.id !== fileIdToRemove)
    );
  };

  const [isRecording, setIsRecording] = useState(false);
  const handleSTTTranscript = (text: string) => {
    setInput((prev) => prev + text);
    setIsRecording(false);
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    if (typeof window !== "undefined") {
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (profile?.id && profile.role) {
        setUserRole(profile.role as UserRole);
      } else if (!profileLoading && !profile?.id) {
        setUserRole("guest");
      }
    };
    checkUserRole();
  }, [profile, profileLoading]);

  const handleComplaintComplete = () => {
    setShowComplaintForm(false);
    const followUpMessage: Message = {
      role: "assistant",
      content:
        "Thank you for your submission. Is there anything else I can help you with today?",
      timestamp: new Date(),
      id: generateMessageId(),
    };
    setMessages((prev) => [...prev, followUpMessage]);
  };

  const processedMessages = useMemo(() => {
    const result: Message[] = [];
    messages.forEach((message) => {
      const cleanedMessage = {
        ...message,
        content: extractMessageContent(message.content),
      };

      if (
        cleanedMessage.role === "assistant" &&
        cleanedMessage.content.includes("<iframe")
      ) {
        const { iframes, textSegments } = extractIframes(
          cleanedMessage.content
        );

        if (iframes.length > 0) {
          const textOnlyContent = textSegments.join("\n\n").trim();
          if (textOnlyContent) {
            result.push({
              ...cleanedMessage,
              content: textOnlyContent,
            });
          }
          iframes.forEach((iframe, i) => {
            result.push({
              role: "assistant",
              content: iframe,
              timestamp: new Date(
                cleanedMessage.timestamp.getTime() + (i + 1) * 10
              ),
              id: `${cleanedMessage.id}-iframe-${i}`,
            });
          });
        } else {
          result.push(cleanedMessage);
        }
      } else {
        result.push(cleanedMessage);
      }
    });
    return result;
  }, [messages]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!firebaseUserId) {
      console.error("User not logged in, cannot delete Firebase conversation.");
      toast({
        title: "Error",
        description: "You must be logged in to delete conversations.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteConversation(conversationId);
      setConversationsList((prevConvos) =>
        prevConvos.filter((convo) => convo.id !== conversationId)
      );

      toast({
        title: "Chat Deleted",
        description: "The conversation has been removed.",
      });

      if (currentConversationId === conversationId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openLightbox = (url: string) => {
    setLightboxImageUrl(url);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImageUrl(null);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-primary overflow-hidden">
      {/* New Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-primary text-primary-foreground flex items-center justify-between px-4 shadow-lg z-40">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7">
              <Image
                src="/images/indianapolis.png"
                alt="Indianapolis Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="font-semibold text-base">Indy Chat</h1>
            {isTemporaryChat && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-medium bg-yellow-400 text-yellow-900 rounded-full">
                Temp
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-primary-foreground hover:bg-white/20 transition-colors"
            aria-label="Open menu">
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>
      )}

      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
        startNewTemporaryChat={startNewTemporaryChat}
        isTemporaryChat={isTemporaryChat}
        userRole={userRole}
        conversations={conversationsList}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        isLoadingConversations={isLoadingConversations}
        onDeleteConversation={handleDeleteConversation}
      />

      <div
        className={`flex-1 flex flex-col bg-background h-full overflow-hidden ${
          isMobile ? "pt-14" : ""
        }`}>
        <div className="flex-1 overflow-y-auto py-4 px-2 sm:px-4 md:px-8">
          <div
            className={`max-w-3xl mx-auto space-y-6 ${
              isMobile ? "pt-4" : "pt-16 md:pt-12"
            } pb-24`}>
            {processedMessages.map((message) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}>
                {message.role === "assistant" && (
                  <div className="flex gap-3 max-w-[90%]">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-accent overflow-hidden">
                      <Image
                        src="/images/indianapolis.png"
                        alt="Indianapolis Logo"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-card text-card-foreground shadow-sm">
                      {message.content.includes("<iframe") &&
                      message.id.includes("-iframe-") ? (
                        <div className="w-full my-2">
                          {createSafeIframe(message.content, isMobile)}
                        </div>
                      ) : (
                        <>
                          <MessageContent
                            content={message.content}
                            onComplaintClick={() => {
                              setComplaintType("complaint");
                              setShowComplaintForm(true);
                            }}
                            onImageClick={openLightbox}
                          />

                          {!message.content.includes("<iframe") &&
                            message.content &&
                            message.content.trim() !== "" && (
                              <div className="mt-2 text-xs flex justify-end items-center gap-4">
                                <TTSButton
                                  text={extractMessageContent(message.content)}
                                  profile={profile}
                                />
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground max-w-[85%]">
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.attachedFiles &&
                      message.attachedFiles.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-primary/10">
                          <div className="flex flex-wrap gap-1.5">
                            {message.attachedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-1 bg-primary-foreground/10 text-primary-foreground text-[11px] px-1.5 py-0.5 rounded-md whitespace-nowrap"
                                title={file.name}>
                                <FileIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </motion.div>
            ))}

            {showComplaintForm && firebaseUserId && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-accent overflow-hidden">
                    <Image
                      src="/images/indianapolis.png"
                      alt="Indianapolis Logo"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <ComplaintMessage
                    type={complaintType}
                    onComplete={handleComplaintComplete}
                    userId={firebaseUserId}
                  />
                </div>
              </motion.div>
            )}

            {isLoading && !showComplaintForm && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-accent overflow-hidden">
                    <Image
                      src="/images/indianapolis.png"
                      alt="Indianapolis Logo"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <div className="rounded-2xl px-6 py-4 bg-card shadow-sm">
                    <div className="flex space-x-2">
                      <div
                        className="h-2 w-2 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="h-2 w-2 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className="h-2 w-2 bg-secondary rounded-full animate-bounce"
                        style={{ animationDelay: "400ms" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-16" />
          </div>
        </div>

        <div className="bg-background border-t border-border p-2 md:p-4">
          <div className="max-w-3xl mx-auto">
            {/* "File a Complaint" Quick Action Button/Chip */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-accent hover:text-white"
                onClick={() => {
                  setComplaintType("complaint");
                  setShowComplaintForm(true);
                  setInput("");
                }}>
                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                File a Complaint
              </Button>
              {/* You can add other quick action buttons here if needed */}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md border border-border">
                    <FileIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${file.name}`}
                      disabled={isUploading || isLoading}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-background border border-input rounded-md shadow-sm p-2.5 text-sm placeholder:text-xs sm:placeholder:text-sm placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="default"
                size="icon"
                className="text-muted-foreground hover:bg-accent hover:text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isLoading}
                aria-label="Attach file">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              />

              {profile?.stt_enabled && (
                <STTButton
                  onTranscript={handleSTTTranscript}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  profile={profile}
                  disabled={isLoading}
                />
              )}

              <Button
                type="submit"
                variant="default"
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-accent hover:text-white rounded-md w-10 h-10 flex-shrink-0"
                disabled={
                  (!input.trim() && uploadedFiles.length === 0) ||
                  isLoading ||
                  isUploading
                }
                aria-label="Send message">
                {isLoading && !isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              IndyChat · Powered by City of Indianapolis
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && lightboxImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 cursor-zoom-out"
          onClick={closeLightbox}>
          <div
            className="relative max-w-[90vw] max-h-[90vh] bg-white p-2 rounded-lg shadow-xl overflow-auto cursor-default"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 z-10"
              aria-label="Close image view">
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Enlarged view"
              className="block max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
