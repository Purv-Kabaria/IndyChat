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
  Volume2,
  Mic,
  MicOff,
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
import { Message, UploadedFile, DifyFileParam } from "@/types/chat";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { TTSButton } from "@/components/ui/TTSButton";
import { STTButton } from "@/components/ui/STTButton";
import { UserRole } from '@/lib/auth-utils';
import ChatSidebar from "./ChatSidebar";
import { ComplaintMessage } from "./ComplaintMessage";
import { ComplaintType } from "@/lib/complaints";

const extractMessageContent = (content: string): string => {
  if (!content || typeof content !== "string") return "";

  if (content.trim().startsWith("{") && content.includes('"action_input"')) {
    try {
      const jsonContent = JSON.parse(content);
      if (jsonContent.action_input) {
        return jsonContent.action_input;
      }
    } catch {
    }
  }
  return content;
};

function MessageContent({ content, onComplaintClick }: { content: string, onComplaintClick: () => void }) {
  const hasComplaintButton = content.includes("<complaint button>");
  const cleanContent = hasComplaintButton ? content.replace(/<complaint button>/g, "") : content;
  
  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({
            href,
            children,
            ...props
          }: React.HTMLProps<HTMLAnchorElement>) => (
            <a
              href={href}
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline">
              {children}
            </a>
          ),
          p: ({
            children,
          }: React.HTMLProps<HTMLParagraphElement>) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-3 ml-2">
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-3 ml-2">
              {children}
            </ul>
          ),
          li: ({
            children,
          }: React.HTMLProps<HTMLLIElement>) => (
            <li className="mb-1">{children}</li>
          ),
          code: ({
            inline,
            className,
            children,
            ...props
          }: React.HTMLProps<HTMLElement> & {
            inline?: boolean;
          }) => {
            const match = /language-(\w+)/.exec(
              className || ""
            );
            const language = match?.[1];
            return !inline ? (
              <pre
                className={`bg-accent/90 rounded-md p-3 my-3 overflow-x-auto language-${
                  language || "none"
                }`}>
                <code
                  className={`block text-primary text-sm font-mono whitespace-pre`}
                  {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className={`bg-accent/20 text-accent rounded px-1 py-0.5 text-xs font-mono ${
                  className || ""
                }`}
                {...props}>
                {children}
              </code>
            );
          },
        }}>
        {cleanContent}
      </ReactMarkdown>
      
      {hasComplaintButton && (
        <div className="mt-3">
          <Button 
            onClick={onComplaintClick}
            className="bg-accent hover:bg-accent/90 text-white"
            size="sm"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            File a Complaint
          </Button>
        </div>
      )}
    </>
  );
}

export default function ChatComponent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageIdCounterRef = useRef(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasInitializedRef = useRef(false);
  const processedIframeMessagesRef = useRef<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClientComponentClient();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintType, setComplaintType] = useState<ComplaintType>('complaint');

  const { profile } = useUserProfile();

  const generateMessageId = () => {
    const counter = messageIdCounterRef.current;
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${counter}`;
  };

  const generateUserId = () => {
    return `web-user-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  };

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

  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      const promptParam = searchParams.get("prompt");
      let currentUserId = userId;
      if (!currentUserId) {
        currentUserId = generateUserId();
        setUserId(currentUserId);
      }

      if (messages.length === 0) {
        if (promptParam) {
          const initialUserMessage: Message = {
            role: "user",
            content: promptParam,
            timestamp: new Date(),
            id: generateMessageId(),
          };

          setMessages([initialUserMessage]);

          sendMessageToBackend(
            promptParam,
            currentUserId,
            [],
            conversationId,
            generateMessageId,
            setMessages,
            setIsLoading,
            setConversationId
          ).catch((err) => console.error("Initial prompt send failed:", err));
        }
      }
    }
  }, [searchParams, userId, conversationId, messages.length]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if ((!trimmedInput && uploadedFiles.length === 0) || isLoading) return;

      // Special case for direct complaint requests
      const lowerTrimmedInput = trimmedInput.toLowerCase();
      if (lowerTrimmedInput === "i have a complaint" || lowerTrimmedInput === "i want to make a complaint") {
        setInput("");
        setUploadedFiles([]);
        setComplaintType('complaint');
        setShowComplaintForm(true);
        return;
      }
      
      // Check for other complaint intents
      const complaintIntent = detectComplaintIntent(trimmedInput);
      if (complaintIntent) {
        // Create a new message from the user
        const userMessage: Message = {
          role: "user",
          content: trimmedInput,
          timestamp: new Date(),
          id: generateMessageId(),
          attachedFiles: [...uploadedFiles],
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setUploadedFiles([]);
        
        // Show appropriate assistant response
        setTimeout(() => {
          // Add a message from the assistant offering to submit a complaint
          const assistantResponse: Message = {
            role: "assistant",
            content: complaintIntent === 'complaint' 
              ? "I understand you're having an issue. Would you like to submit a formal complaint?"
              : complaintIntent === 'report'
              ? "Would you like to report this issue to our team?"
              : complaintIntent === 'feedback'
              ? "Thank you for your feedback. Would you like to submit it formally to our team?"
              : "Thanks for your suggestion. Would you like to submit it formally to our team?",
            timestamp: new Date(),
            id: generateMessageId(),
          };
          
          setMessages((prev) => [...prev, assistantResponse]);
          
          // Show the complaint form
          setComplaintType(complaintIntent);
          setShowComplaintForm(true);
        }, 1000);
        
        return;
      }

      if (trimmedInput || uploadedFiles.length > 0) {
        const userMessage: Message = {
          role: "user",
          content: trimmedInput,
          timestamp: new Date(),
          id: generateMessageId(),
          attachedFiles: [...uploadedFiles],
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
      } else {
        return;
      }

      let userIdToSend = userId;
      if (!userIdToSend) {
        userIdToSend = generateUserId();
        setUserId(userIdToSend);
        console.warn("handleSubmit: userId was null, generated:", userIdToSend);
      }

      const filesToSubmit: DifyFileParam[] = uploadedFiles.map((file) => ({
        type: file.type,
        transfer_method: "local_file",
        upload_file_id: file.id,
      }));

      setUploadedFiles([]);

      try {
        await sendMessageToBackend(
          trimmedInput, 
          userIdToSend, 
          filesToSubmit,
          conversationId,
          generateMessageId,
          setMessages,
          setIsLoading,
          setConversationId
        );
      } catch (error) {
        console.error("handleSubmit Error:", error);
      }
    },
    [input, isLoading, userId, uploadedFiles, conversationId]
  );

  const startNewChat = () => {
    setConversationId(null);
    setSidebarOpen(false);
  };

  const handleSTTTranscript = (text: string) => {
    setInput((prev) => {
      const currentInput = prev.trim();
      return currentInput.length > 0 ? `${currentInput} ${text}` : text;
    });
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, height: 0 },
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
        !processedIframeMessagesRef.current.has(cleanedMessage.id)
      ) {
        const { iframes, textSegments } = extractIframes(
          cleanedMessage.content
        );

        if (iframes.length > 0) {
          processedIframeMessagesRef.current.add(cleanedMessage.id);

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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && data) {
            setUserRole(data.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, [supabase.auth]);

  // Function to detect complaint-related queries
  const detectComplaintIntent = (message: string): ComplaintType | null => {
    const lowerMessage = message.toLowerCase();
    
    if (
      lowerMessage.includes("complain") || 
      lowerMessage.includes("not working") || 
      lowerMessage.includes("doesn't work") || 
      lowerMessage.includes("problem with") ||
      lowerMessage.includes("issue with") ||
      lowerMessage.includes("terrible") ||
      lowerMessage.includes("awful") ||
      lowerMessage.includes("frustrated")
    ) {
      return 'complaint';
    }
    
    if (
      lowerMessage.includes("report") || 
      lowerMessage.includes("broken") || 
      lowerMessage.includes("error") || 
      lowerMessage.includes("bug") ||
      lowerMessage.includes("not functioning")
    ) {
      return 'report';
    }
    
    if (
      lowerMessage.includes("feedback") || 
      lowerMessage.includes("opinion") || 
      lowerMessage.includes("experience") || 
      lowerMessage.includes("think about")
    ) {
      return 'feedback';
    }
    
    if (
      lowerMessage.includes("suggest") || 
      lowerMessage.includes("idea") || 
      lowerMessage.includes("improve") || 
      lowerMessage.includes("better if") ||
      lowerMessage.includes("would be nice")
    ) {
      return 'suggestion';
    }
    
    return null;
  };

  const handleComplaintComplete = () => {
    setShowComplaintForm(false);
    
    // Add a follow-up message from the assistant
    const followUpMessage: Message = {
      role: "assistant",
      content: "Thank you for your submission. Is there anything else I can help you with today?",
      timestamp: new Date(),
      id: generateMessageId(),
    };
    
    setMessages((prev) => [...prev, followUpMessage]);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-primary overflow-hidden">
      <div className="absolute top-3 left-3 md:hidden z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-accent text-primary hover:bg-accent/90 transition-colors">
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      <ChatSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto py-4 px-2 sm:px-4 md:px-8">
          <div className="max-w-3xl mx-auto space-y-6 pt-16 md:pt-12">
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
                    <div className="rounded-2xl px-4 py-3 bg-[#f1f1f3] text-accent relative">
                      {message.content.includes("<iframe") &&
                        message.id.includes("-iframe-") ? (
                          createSafeIframe(message.content, isMobile)
                        ) : (
                          <>
                            <MessageContent
                              content={message.content}
                              onComplaintClick={() => {
                                setComplaintType('complaint');
                                setShowComplaintForm(true);
                              }}
                            />
                            
                            {!message.content.includes("<iframe") && (
                              <div className="mt-2 text-xs flex justify-end items-center gap-4">
                                <TTSButton
                                  text={extractMessageContent(message.content)}
                                  profile={profile}
                                  isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                                  isLastMessage={message.id === messages[messages.length - 1]?.id}
                                />
                              </div>
                            )}
                          </>
                        )}
                    </div>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="rounded-2xl px-4 py-3 bg-primary border border-accent/10 text-accent max-w-[85%]">
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.attachedFiles &&
                      message.attachedFiles.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-accent/10">
                          <div className="flex flex-wrap gap-1.5">
                            {message.attachedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-1 bg-accent/10 text-accent text-[11px] px-1.5 py-0.5 rounded-md whitespace-nowrap"
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

            {showComplaintForm && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
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
                  />
                </div>
              </motion.div>
            )}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
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
                  <div className="rounded-2xl px-6 py-4 bg-[#f1f1f3]">
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

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="border-t border-accent/10 bg-primary p-4 relative">
          <div className="max-w-3xl mx-auto">
            <div className="mb-2 flex flex-wrap items-center">
              <div 
                onClick={() => setInput("I have a complaint")}
                className="cursor-pointer flex items-center bg-accent/5 text-accent text-xs px-3 py-1.5 rounded-full border border-accent/20 mr-2 hover:bg-accent/10 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                I have a complaint
              </div>
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 w-full">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-1 bg-accent/10 text-accent text-xs px-2 py-1 rounded-md border border-accent/20">
                      <FileIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-1 text-secondary hover:text-secondary/80"
                        aria-label={`Remove ${file.name}`}
                        disabled={isUploading}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isMobile ? "Message Indy..." : "Message IndyChat..."}
                  className="w-full rounded-3xl border border-accent/20 bg-white px-4 py-2 pr-32 h-[40px] text-accent text-xs placeholder-accent/60 focus:outline-none focus:border-accent/30"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !isLoading &&
                      (input.trim() || uploadedFiles.length > 0)
                    ) {
                      e.preventDefault();
                      handleSubmit(
                        e as React.KeyboardEvent<HTMLInputElement>
                      );
                    }
                  }}
                />

                {profile?.stt_enabled && (
                  <div className="absolute right-28 top-1/2 -translate-y-1/2">
                    <STTButton
                      onTranscript={handleSTTTranscript}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent disabled:opacity-50"
                  aria-label="Attach file">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>

                {profile && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const newTtsEnabled = !profile.tts_enabled;
                        await supabase.auth.updateUser({
                          data: {
                            tts_enabled: newTtsEnabled,
                          },
                        });
                      } catch (error) {
                        console.error("Error updating TTS setting:", error);
                      }
                    }}
                    className={`absolute right-12 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent ${
                      profile.tts_enabled ? "text-accent" : "text-accent/40"
                    }`}
                    aria-label={
                      profile.tts_enabled
                        ? "Disable text-to-speech"
                        : "Enable text-to-speech"
                    }
                    title={
                      profile.tts_enabled
                        ? "Disable text-to-speech"
                        : "Enable text-to-speech"
                    }>
                    <Volume2 className="h-5 w-5" />
                  </button>
                )}

                {profile && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const newSttEnabled = !profile.stt_enabled;
                        await supabase.auth.updateUser({
                          data: {
                            stt_enabled: newSttEnabled,
                          },
                        });
                      } catch (error) {
                        console.error("Error updating STT setting:", error);
                      }
                    }}
                    className={`absolute right-20 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent ${
                      profile.stt_enabled ? "text-accent" : "text-accent/40"
                    }`}
                    aria-label={
                      profile.stt_enabled
                        ? "Disable speech-to-text"
                        : "Enable speech-to-text"
                    }
                    title={
                      profile.stt_enabled
                        ? "Disable speech-to-text"
                        : "Enable speech-to-text"
                    }>
                    {profile.stt_enabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.txt,.md,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.gif,.csv,.html,.xml,.eml,.msg,.epub"
                />
              </div>

              <Button
                type="submit"
                className="rounded-full bg-secondary hover:bg-secondary/90 text-white h-[50px] w-[50px] flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                disabled={
                  isLoading || (!input.trim() && uploadedFiles.length === 0)
                }
                aria-label="Send message">
                {isLoading && !isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>

            <div className="mt-2 text-xs text-center text-accent/50">
              IndyChat · Powered by City of Indianapolis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
