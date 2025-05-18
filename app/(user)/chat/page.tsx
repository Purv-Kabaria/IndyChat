"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from "lucide-react";

const ChatComponent = dynamic(
  () => import('@/components/ChatComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6 overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }
);

export default function ChatPage() {
  return (
    <div className="min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
      <Suspense fallback={
        <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6 overflow-hidden">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      }>
        <ChatComponent />
      </Suspense>
    </div>
  );
} 