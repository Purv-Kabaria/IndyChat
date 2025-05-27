"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  File,
  Shield,
  Menu,
  X,
  ChevronLeft,
  AlertCircle,
  Newspaper,
  MessageCircle,
} from "lucide-react";

export default function AdminNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Complaints",
      href: "/admin/complaints",
      icon: AlertCircle,
    },
    {
      name: "Documents",
      href: "/admin/documents",
      icon: File,
    },
    {
      name: "Articles",
      href: "/admin/articles",
      icon: Newspaper,
    },
    {
      name: "Conversations",
      href: "/admin/conversations",
      icon: MessageCircle,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") {
      return true;
    }
    return pathname.startsWith(path) && path !== "/admin";
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      {/* Mobile menu spacer - pushes content down on mobile */}
      <div className="lg:hidden h-16"></div>

      {/* Mobile menu button */}
      <div
        className={`lg:hidden fixed top-4 left-4 z-50 ${
          mobileMenuOpen ? "hidden" : "block"
        }`}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 rounded-lg bg-accent shadow-lg text-white transition-all duration-200 hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-white/20">
          <Menu size={22} />
        </button>
      </div>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-accent to-accent-dark shadow-xl">
          <div className="flex items-center h-16 flex-shrink-0 px-6 bg-accent-dark">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-white" />
              <span className="text-white text-xl font-cal font-bold tracking-wide">
                Admin Portal
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto pt-6 pb-4">
            <div className="px-4 mb-6">
              <button
                onClick={handleGoBack}
                className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-100 hover:bg-accent-dark/50 hover:text-white w-full transition-colors duration-200 group">
                <ChevronLeft
                  className="mr-3 flex-shrink-0 h-5 w-5 text-gray-300 group-hover:text-white transition-colors duration-200"
                  aria-hidden="true"
                />
                <span>Back</span>
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-accent-dark text-white shadow-md"
                        : "text-gray-100 hover:bg-accent-dark/50 hover:text-white"
                    }`}>
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        active
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white transition-colors duration-200"
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 flex z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
        <div
          className={`fixed inset-0 bg-gray-800 transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? "bg-opacity-80 backdrop-blur-sm" : "bg-opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}></div>
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-accent to-accent-dark shadow-2xl transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-b border-accent-dark/30">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-white" />
                <span className="ml-3 text-white text-xl font-cal font-bold tracking-wide">
                  Admin Portal
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-white hover:bg-accent-dark/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="px-4 mt-6 mb-4">
              <button
                onClick={handleGoBack}
                className="flex items-center px-4 py-3 text-base font-medium rounded-lg text-gray-100 hover:bg-accent-dark/50 hover:text-white w-full transition-colors duration-200 group">
                <ChevronLeft
                  className="mr-4 flex-shrink-0 h-6 w-6 text-gray-300 group-hover:text-white transition-colors duration-200"
                  aria-hidden="true"
                />
                Back
              </button>
            </div>
            <nav className="mt-4 px-4 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-accent-dark text-white shadow-md"
                        : "text-gray-100 hover:bg-accent-dark/50 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}>
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        active
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white transition-colors duration-200"
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
      </div>
    </>
  );
}
