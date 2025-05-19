"use client";

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ChatComponent = dynamic(
  () => import('@/components/chat/ChatComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6 overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }
);

function ChatPageContent() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login?message=Please log in to access chat');
        return;
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

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

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-primary via-primary to-accent/10 px-4 sm:px-6 overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
} 