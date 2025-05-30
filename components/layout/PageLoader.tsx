"use client";

import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
      <p className="text-lg text-accent font-semibold">Loading IndyChat...</p>
      <p className="text-sm text-gray-600">Please wait a moment.</p>
    </div>
  );
};

export default PageLoader; 