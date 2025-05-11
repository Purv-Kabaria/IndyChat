import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-primary py-4 lg:py-8 px-2 lg:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="hidden lg:block text-center mb-4 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-cal text-accent mb-2 lg:mb-4">
            IndyChat
          </h1>
          <p className="text-accent/80 font-mont text-sm lg:text-base">
            Your AI Assistant for Indianapolis
          </p>
        </div>
        <div className="relative pt-16 lg:pt-0">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
