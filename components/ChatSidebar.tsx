'use client';

import { Plus, X } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed lg:static inset-0 lg:inset-y-0 lg:left-0 z-50 lg:w-64 lg:h-full bg-white lg:border-r border-accent/10 flex flex-col transition-transform duration-200 ${
        isOpen ? 'translate-y-0' : '-translate-y-full lg:translate-y-0 lg:translate-x-0'
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-accent/10 lg:hidden">
          <h2 className="text-xl font-cal text-accent">IndyChat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-accent" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          className="m-4 p-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-mont"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Example Chat Items */}
          <button
            className="w-full p-3 rounded-lg mb-2 text-left transition-all bg-accent text-white"
          >
            <p className="font-mont truncate">Welcome to IndyChat</p>
            <p className="text-xs opacity-70 mt-1">
              May 12, 2024
            </p>
          </button>
          <button
            className="w-full p-3 rounded-lg mb-2 text-left transition-all hover:bg-accent/10 text-accent"
          >
            <p className="font-mont truncate">City Services Information</p>
            <p className="text-xs opacity-70 mt-1">
              May 11, 2024
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-accent/10">
          <p className="text-sm text-accent/70 font-mont">
            IndyChat v1.0
          </p>
        </div>
      </div>
    </>
  );
} 