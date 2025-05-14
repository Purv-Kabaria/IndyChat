"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send,
  MenuIcon,
  Plus,
  Loader2,
  Paperclip,
  X,
  File as FileIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

const INTERNAL_API_URL = "/api/chat";
const UPLOAD_API_URL = "/api/upload";

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  fileObject?: File;
};

type DifyFileParam = {
  type: string;
  transfer_method: "local_file";
  upload_file_id: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
  attachedFiles?: UploadedFile[];
};

function extractIframes(content: string): { iframes: string[], textSegments: string[] } {
  const iframeRegex = /<iframe[^>]*>[\s\S]*?<\/iframe>/gi;
  const textSegments: string[] = [];
  const iframes: string[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = iframeRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) textSegments.push(textBefore);
    
    iframes.push(match[0]);
    
    lastIndex = match.index + match[0].length;
  }
  
  const textAfter = content.substring(lastIndex).trim();
  if (textAfter) textSegments.push(textAfter);
  
  if (iframes.length === 0) {
    textSegments.push(content);
  }
  
  return { iframes, textSegments };
}

function createSafeIframe(iframeHtml: string, isMobile: boolean): React.ReactElement {
  const srcMatch = iframeHtml.match(/src=["\'](.*?)["\']/i);
  const src = srcMatch ? srcMatch[1] : "";

  const widthAttrMatch = iframeHtml.match(/width=["\'](.*?)["\']/i);
  const heightAttrMatch = iframeHtml.match(/height=["\'](.*?)["\']/i);

  const numWidth = widthAttrMatch ? parseInt(widthAttrMatch[1], 10) : NaN;
  const numHeight = heightAttrMatch ? parseInt(heightAttrMatch[1], 10) : NaN;

  const iframeProps = {
    src: src,
    className: "w-full h-full border-none",
    sandbox: "allow-scripts allow-same-origin allow-forms",
    loading: "lazy" as "lazy", 
    title: "Embedded content", 
    referrerPolicy: "no-referrer" as "no-referrer", 
    allowFullScreen: true,
  };

  if (isMobile) {
    let aspectRatioClass = "aspect-w-4 aspect-h-3"; // Default for mobile
    if (!isNaN(numWidth) && !isNaN(numHeight) && numHeight > 0) {
        const ratio = numWidth / numHeight;
        if (Math.abs(ratio - (16/9)) < 0.01) { // Use a smaller tolerance for precision
          aspectRatioClass = "aspect-w-16 aspect-h-9";
        } else if (Math.abs(ratio - (4/3)) < 0.01) {
          aspectRatioClass = "aspect-w-4 aspect-h-3";
        }
        // Add other common ratios if needed, e.g., 1:1, 3:2
    }
    return (
      <div className={`w-full ${aspectRatioClass} rounded-lg overflow-hidden`}>
        <iframe {...iframeProps} />
      </div>
    );
  } else { // Desktop
    const styleWidth = !isNaN(numWidth) 
      ? `${numWidth}px` 
      : (widthAttrMatch ? widthAttrMatch[1] : "600px");
    const styleHeight = !isNaN(numHeight) 
      ? `${numHeight}px` 
      : (heightAttrMatch ? heightAttrMatch[1] : "450px");

    return (
      <div
        className="overflow-hidden rounded-lg"
        style={{ 
          width: styleWidth, 
          height: styleHeight, 
          maxWidth: "100%"
        }}
      >
        <iframe {...iframeProps} />
      </div>
    );
  }
}

function getDifyFileType(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  if (mimeType.startsWith("image/")) return "image";
  if (
    [
      "pdf",
      "txt",
      "md",
      "markdown",
      "html",
      "xlsx",
      "xls",
      "docx",
      "csv",
      "eml",
      "msg",
      "pptx",
      "ppt",
      "xml",
      "epub",
    ].includes(extension || "")
  ) {
    return "document";
  }
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";

  return "document";
}

export default function ChatComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const conversationHistory = [
    { id: 1, title: "City Services Information", date: "2 days ago" },
    { id: 2, title: "Trash Collection Schedule", date: "1 week ago" },
    { id: 3, title: "Parks and Recreation", date: "2 weeks ago" },
  ];

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

  const uploadFile = async (
    file: File,
    userIdToSend: string
  ): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", userIdToSend);

    try {
      const response = await fetch(UPLOAD_API_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Upload failed for ${file.name}:`, result);
        alert(
          `Upload failed for ${file.name}: ${result.details || result.error}`
        );
        return null;
      }

      const difyType = getDifyFileType(file);
      return {
        id: result.id,
        name: file.name,
        size: file.size,
        type: difyType,
        fileObject: file,
      };
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      alert(`Error uploading ${file.name}. Check console for details.`);
      return null;
    }
  };

  const removeFile = (fileIdToRemove: string) => {
    setUploadedFiles((prev) =>
      prev.filter((file) => file.id !== fileIdToRemove)
    );
  };

  const sendMessageToBackend = useCallback(
    async (
      userInput: string,
      userIdToSend: string,
      filesToSend: DifyFileParam[]
    ) => {
      let assistantMessageId = generateMessageId();
      setIsLoading(true);
      try {
        const headers = {
          "Content-Type": "application/json",
        };
        const requestBody: any = {
          query: userInput,
          user: userIdToSend,
        };
        if (conversationId) {
          requestBody.conversation_id = conversationId;
        }
        if (filesToSend && filesToSend.length > 0) {
          requestBody.files = filesToSend;
        }

        const response = await fetch(INTERNAL_API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorData = {
            error: `HTTP error! status: ${response.status}`,
            details: "",
          };
          try {
            const errorJson = await response.json();
            errorData.error =
              errorJson.error || `HTTP error! status: ${response.status}`;
            errorData.details = errorJson.details || JSON.stringify(errorJson);
          } catch (e) {
            try {
              errorData.details = await response.text();
            } catch (textError) {
              errorData.details = "Could not read error response body.";
            }
          }
          console.error(
            "sendMessageToBackend: Backend API returned an error:",
            errorData
          );
          throw new Error(
            errorData.error +
              (errorData.details ? ` - ${errorData.details}` : "")
          );
        }
        if (!response.body) {
          throw new Error("ReadableStream not supported by backend response");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let conversationIdFound = false;
        let buffer = "";
        assistantMessageId = generateMessageId();
        // Add placeholder message first
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            timestamp: new Date(),
            id: assistantMessageId,
          },
        ]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Append new data to the buffer
            buffer += decoder.decode(value, { stream: true });

            // Process buffer line by line
            let boundary = buffer.indexOf("\n");
            while (boundary !== -1) {
              const line = buffer.substring(0, boundary).trim();
              buffer = buffer.substring(boundary + 1);

              if (line.startsWith("data: ")) {
                try {
                  const jsonString = line.substring(5).trim(); // Get content after 'data: '
                  if (jsonString) {
                    // Avoid parsing empty strings
                    const data = JSON.parse(jsonString);

                    if (!conversationIdFound && data.conversation_id) {
                      setConversationId(data.conversation_id);
                      conversationIdFound = true;
                    }

                    // Handle different event types based on Dify's structure
                    if (
                      data.event === "agent_message" ||
                      data.event === "message"
                    ) {
                      // 'message' seems more common for content
                      const contentChunk = data.answer || ""; // Dify uses 'answer'
                      if (contentChunk) {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: msg.content + contentChunk }
                              : msg
                          )
                        );
                      }
                    } else if (data.event === "error") {
                      console.error("Dify stream error event:", data);
                      // Update the UI to show the specific error from Dify
                      const errorMessage =
                        data.message ||
                        "Unknown error from API during response generation";
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? {
                                ...msg,
                                content:
                                  msg.content +
                                  `\n\n[API Error: ${errorMessage}]`,
                              }
                            : msg
                        )
                      );
                    }
                  }
                } catch (e) {
                  console.error(
                    "Error parsing SSE JSON:",
                    e,
                    "Raw line content:",
                    line.substring(5)
                  );
                }
              }
              boundary = buffer.indexOf("\n");
            }
          }
        } catch (streamError) {
          console.error("Error processing stream:", streamError);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: "\n\nError receiving response stream." }
                : msg
            )
          );
        }
      } catch (error: any) {
        console.error("sendMessageToBackend Error:", error);
        const errorMsgId = generateMessageId();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${error.message || "Could not connect."}`,
            timestamp: new Date(),
            id: errorMsgId,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, setIsLoading, setMessages]
  );

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
          
          sendMessageToBackend(promptParam, currentUserId, []).catch((err) =>
            console.error("Initial prompt send failed:", err)
          );
        }
      }
    }
  }, [searchParams, userId, sendMessageToBackend]);

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
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if ((!trimmedInput && uploadedFiles.length === 0) || isLoading) return;

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
        await sendMessageToBackend(trimmedInput, userIdToSend, filesToSubmit);
      } catch (error) {
        console.error("handleSubmit Error:", error);
      }
    },
    [input, isLoading, sendMessageToBackend, userId, uploadedFiles]
  );

  const startNewChat = () => {
    setConversationId(null);
    setSidebarOpen(false);
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, height: 0 },
  };

  // Process messages to extract iframes and create separate iframe messages
  const processedMessages = useMemo(() => {
    const result: Message[] = [];
    
    messages.forEach((message) => {
      if (message.role === "assistant" && !processedIframeMessagesRef.current.has(message.id)) {
        const { iframes, textSegments } = extractIframes(message.content);

        if (iframes.length > 0) {
          // This message contains iframes and needs special processing.
          // Mark the original message ID as processed ONLY if we are splitting it.
          processedIframeMessagesRef.current.add(message.id);

          const textOnlyContent = textSegments.join('\n\n').trim();
          // Only push the text part if it actually has content.
          if (textOnlyContent) {
            result.push({
              ...message, // Use original timestamp and potentially other fields
              content: textOnlyContent,
              // id remains original message.id for this text part
            });
          }

          // Create a separate message for each iframe.
          iframes.forEach((iframe, i) => {
            result.push({
              role: "assistant",
              content: iframe,
              // Ensure timestamp is slightly offset to maintain order if needed, and generate a new unique ID.
              timestamp: new Date(message.timestamp.getTime() + (i + 1) * 10), 
              id: `${message.id}-iframe-${i}` 
            });
          });
        } else {
          // No iframes in this assistant message, push it as is.
          // No need to add to processedIframeMessagesRef as there's nothing to split.
          result.push(message);
        }
      } else {
        // User messages or assistant messages whose iframes have already been extracted.
        // Or, if it's an assistant message that *was* the text-only part from a previous split.
        result.push(message);
      }
    });
    
    return result;
  }, [messages]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
    };
    if (typeof window !== "undefined") {
      checkScreenSize(); // Initial check
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-primary overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="absolute top-3 left-3 md:hidden z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-accent text-primary hover:bg-accent/90 transition-colors">
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-accent text-primary flex-shrink-0 flex flex-col transition-all duration-300 shadow-lg 
        ${
          sidebarOpen
            ? "fixed inset-0 w-full z-50"
            : "w-64 absolute -translate-x-full md:translate-x-0 md:relative md:w-64 z-40"
        } h-full`}>
        <div className="p-4 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/images/indianapolis.png"
                alt="Indianapolis Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="font-semibold text-lg">Indy Chat</h1>
          </div>

          {/* Close button for mobile */}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md bg-accent-light text-primary hover:bg-accent-light/80 transition-colors md:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Rest of sidebar content */}
        <button
          onClick={startNewChat}
          className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-md border border-primary/20 bg-accent-light p-3 text-sm transition-colors hover:bg-accent-light/80">
          <Plus className="h-4 w-4" />
          <span>New chat</span>
        </button>

        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          <div className="border-b border-primary/10 pb-1 mb-2">
            <h2 className="text-xs font-medium text-primary/70 px-2 py-1">
              Recent conversations
            </h2>
            {conversationHistory.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {}}
                className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-start">
                <div className="w-full truncate">
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-primary/60">{conv.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-primary/10 space-y-1">
          <button className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden relative">
        {/* Messages container */}
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
                    <div className="rounded-2xl px-4 py-3 bg-[#f1f1f3] text-accent">
                      {message.id.includes('-iframe-') ? (
                        // This is an iframe message
                        createSafeIframe(message.content, isMobile)
                      ) : (
                        // This is a regular message
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
                          {message.content}
                        </ReactMarkdown>
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

        {/* Input area */}
        <div className="border-t border-accent/10 bg-primary p-4 relative">
          <div className="max-w-3xl mx-auto">
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
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

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message IndyChat..."
                  className="w-full rounded-3xl border border-accent/20 bg-white px-4 py-3 pr-12 resize-none min-h-[50px] max-h-[200px] text-accent focus:outline-none focus:border-accent/30"
                  rows={1}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !isLoading &&
                      (input.trim() || uploadedFiles.length > 0)
                    ) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  style={{ overflowY: "auto" }}
                />
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
