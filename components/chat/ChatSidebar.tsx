'use client';

import React from 'react';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div 
      className={`
        fixed top-0 left-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:block md:w-1/4 z-50
      `}
    >
      <div className="p-4 border-b border-accent/10">
        <button 
          onClick={onClose} 
          className="md:hidden absolute top-4 right-4 text-accent hover:text-accent/70"
        >
          Close
        </button>
        <h2 className="text-xl font-bold text-accent">Chat Options</h2>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          <li className="text-accent/80 hover:text-accent transition-colors">
            New Chat
          </li>
          <li className="text-accent/80 hover:text-accent transition-colors">
            Chat History
          </li>
          <li className="text-accent/80 hover:text-accent transition-colors">
            Settings
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ChatSidebar;

