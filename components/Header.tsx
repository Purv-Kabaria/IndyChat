'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-accent/10 z-50 flex items-center px-4">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-accent" />
      </button>
      <h2 className="text-xl font-cal text-accent ml-4">
        IndyChat
      </h2>
    </div>
  );
} 