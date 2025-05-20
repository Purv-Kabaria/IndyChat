import Link from "next/link";
import { FileX, ChevronLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 p-4 rounded-full">
            <FileX className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>

        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have
          been removed, renamed, or doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-md transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
