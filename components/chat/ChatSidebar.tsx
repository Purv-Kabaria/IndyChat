"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Plus, X, Settings, Shield, Home, MessageSquare, Loader2 } from 'lucide-react';
import SignOutButton from "@/components/SignOutButton";
import { UserRole } from '@/lib/auth-utils';
import { Conversation as ConversationType } from '@/types/chat';

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  startNewChat: () => void;
  userRole: UserRole | 'guest' | null;
  conversations: Omit<ConversationType, 'messages'>[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoadingConversations: boolean;
}

export default function ChatSidebar({
  sidebarOpen,
  setSidebarOpen,
  startNewChat,
  userRole,
  conversations,
  currentConversationId,
  onSelectConversation,
  isLoadingConversations,
}: ChatSidebarProps) {

  const getRelativeTime = (date: Date | undefined): string => {
    if (!date) return "年代不明";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <p className="text-xs text-primary/60 px-2 py-1 text-center">No recent conversations.</p>
        ) : (
          conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onSelectConversation(convo.id)}
              title={`Conversation from ${convo.updatedAt ? convo.updatedAt.toLocaleDateString() : 'unknown date'}`}
              className={`w-full text-left px-2 py-2.5 text-xs rounded-md flex items-center gap-2 transition-colors truncate
                ${
                  currentConversationId === convo.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-primary/5 text-primary/80"
                }`}>
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-grow truncate">
                {`Chat on ${convo.createdAt ? convo.createdAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'}) : '年代不明'}`}
              </span>
              <span className="text-primary/50 text-[10px] flex-shrink-0">
                {getRelativeTime(convo.updatedAt)}
              </span>
            </button>
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
        
        {userRole === 'admin' && (
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
    </div>
  );
}

