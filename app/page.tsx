import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-primary py-4 lg:py-8 px-2 lg:px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-cal text-accent text-center mb-2 lg:mb-4">
          IndyChat
        </h1>
        <p className="text-center text-accent/80 font-mont mb-4 lg:mb-8 text-sm lg:text-base px-4">
          Your AI Assistant for Indianapolis
        </p>
        <ChatInterface />
      </div>
    </main>
  );
}