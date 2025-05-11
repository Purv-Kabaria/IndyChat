'use client';

import { Menu } from 'lucide-react';
import ChatSidebar from './ChatSidebar';

export default function ChatInterface() {
  return (
    <div className="flex h-[80vh] max-w-7xl mx-auto bg-white rounded-lg shadow-xl border-2 border-accent/10 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-accent/10 z-30 flex items-center px-4">
        <button
          className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-accent" />
        </button>
        <h2 className="text-xl font-cal text-accent ml-4">
          IndyChat
        </h2>
      </div>

      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-16 lg:mt-0">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 