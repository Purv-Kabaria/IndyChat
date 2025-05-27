"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  X,
  Settings,
  Shield,
  Home,
  MessageSquare,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { UserRole } from "@/lib/auth-utils";
import { Conversation as ConversationType } from "@/types/chat";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  startNewChat: () => void;
  startNewTemporaryChat: () => void;
  isTemporaryChat: boolean;
  userRole: UserRole | "guest" | null;
  conversations: Omit<ConversationType, "messages">[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoadingConversations: boolean;
  onDeleteConversation: (conversationId: string) => Promise<void>;
}

export default function ChatSidebar({
  sidebarOpen,
  setSidebarOpen,
  startNewChat,
  startNewTemporaryChat,
  isTemporaryChat,
  userRole,
  conversations,
  currentConversationId,
  onSelectConversation,
  isLoadingConversations,
  onDeleteConversation,
}: ChatSidebarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDeleteId, setConversationToDeleteId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getRelativeTime = (date: Date | undefined): string => {
    if (!date) return "Unknown date";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`bg-accent text-primary flex-shrink-0 flex flex-col transition-all duration-300 shadow-lg 
      ${
        sidebarOpen
          ? "fixed inset-0 w-full z-[60] md:z-50"
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
          {isTemporaryChat && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-200 text-yellow-800 rounded-full border border-yellow-300">
              Temporary
            </span>
          )}
        </div>

        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md bg-accent-light text-primary hover:bg-accent-light/80 transition-colors md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <button
        onClick={startNewChat}
        className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-md border border-primary/20 bg-accent-light p-3 text-sm transition-colors hover:bg-accent-light/80">
        <Plus className="h-4 w-4" />
        <span>New chat</span>
      </button>

      <button
        onClick={startNewTemporaryChat}
        className="mx-3 mb-2 flex items-center gap-2 rounded-md border border-primary/20 bg-accent-light/70 p-3 text-sm transition-colors hover:bg-accent-light/90"
        title="Temporary chats are not saved to your history.">
        <MessageSquare className="h-4 w-4 text-primary/70" />
        <span>New Temporary Chat</span>
      </button>

      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
        <div className="border-b border-primary/10 pb-1 mb-2">
          <h2 className="text-xs font-medium text-primary/70 px-2 py-1">
            Recent conversations
          </h2>
        </div>
        {isLoadingConversations ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-primary/60 px-2 py-1 text-center">
            No recent conversations.
          </p>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              className="group relative flex items-center w-full">
              <button
                onClick={() => {
                  onSelectConversation(convo.id);
                }}
                title={
                  isMounted && convo.updatedAt
                    ? `Conversation from ${convo.updatedAt.toLocaleDateString()}`
                    : "Loading conversation details"
                }
                className={`flex-grow text-left pl-2 pr-8 py-2.5 text-xs rounded-md flex items-center gap-2 transition-colors truncate
                  ${
                    currentConversationId === convo.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-primary/5 text-primary/80"
                  }`}>
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-grow truncate min-w-0">
                  {isMounted ? (
                    `Chat on ${
                      convo.createdAt
                        ? convo.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Unknown date"
                    }`
                  ) : (
                    <span className="text-primary/60">Loading title...</span>
                  )}
                </span>
                <span className="text-primary/50 text-[10px] flex-shrink-0 ml-1">
                  {isMounted ? getRelativeTime(convo.updatedAt) : ""}
                </span>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setConversationToDeleteId(convo.id);
                  setDeleteConfirmOpen(true);
                }}
                title="Delete chat"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-primary/40 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-primary/10 space-y-1">
        <Link href="/">
          <button className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </Link>

        <Link href="/profile">
          <button className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </Link>

        {userRole === "admin" && (
          <Link href="/admin/users">
            <button className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
          </Link>
        )}

        <SignOutButton
          variant="minimal"
          className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent-light/50 transition-colors"
        />
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Chat Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to permanently delete this chat? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => setConversationToDeleteId(null)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
              onClick={async () => {
                if (conversationToDeleteId) {
                  setIsDeleting(true);
                  try {
                    if (typeof onDeleteConversation === "function") {
                      await onDeleteConversation(conversationToDeleteId);
                    } else {
                      console.error(
                        "onDeleteConversation is not a function. Please pass it from the parent component."
                      );
                    }
                  } catch (error) {
                    console.error("Failed to delete conversation:", error);
                  }
                  setConversationToDeleteId(null);
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Chat"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
