"use client";

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login?message=Please log in to access chat');
        return;
      }
      if (!user.emailVerified) {
        router.push(`/verify?email=${user.email}&message=Please verify your email to access the chat.`);
        return;
      }
    });

    return () => unsubscribe();
  }, [router]);

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