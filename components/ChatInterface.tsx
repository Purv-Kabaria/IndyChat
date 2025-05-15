'use client';

import { Send } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import { useState } from 'react';
import Header from './Header';

export default function ChatInterface() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[80vh] max-w-7xl mx-auto bg-white rounded-lg shadow-xl border-2 border-accent/10 overflow-hidden">
      {/* Mobile Header */}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Sidebar */}
      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center items-center h-full">
            <p className="text-accent/60 font-mont text-center">
              Welcome to IndyChat! Start a new chat to begin asking questions about Indianapolis.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form className="p-4 border-t border-accent/10 bg-accent/5">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask about Indianapolis..."
              className="flex-1 p-2 border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mont bg-white"
            />
            <button
              type="submit"
              className="bg-accent text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 