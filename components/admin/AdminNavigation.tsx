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
  Newspaper,
} from "lucide-react";

export default function AdminNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Users",
      href: "/admin",
      icon: Users,
    },
    {
      name: "Documents",
      href: "/admin/documents",
      icon: File,
    },
    {
      name: "News",
      href: "/admin/news",
      icon: Newspaper,
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
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-gray-800 text-white transition-all duration-200 hover:bg-gray-700">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-accent">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-accent-dark">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-white" />
              <span className="text-white text-xl font-cal font-bold">
                Admin
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <div className="px-2 mb-4">
              <button
                onClick={handleGoBack}
                className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-100 hover:bg-accent-dark/70 hover:text-white w-full">
                <ChevronLeft
                  className="mr-3 flex-shrink-0 h-5 w-5 text-gray-300"
                  aria-hidden="true"
                />
                Back
              </button>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      active
                        ? "bg-accent-dark text-white"
                        : "text-gray-100 hover:bg-accent-dark/70 hover:text-white"
                    }`}>
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        active
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white"
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
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? "bg-opacity-75" : "bg-opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}></div>
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-accent transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Shield className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-xl font-cal font-bold">
                Admin
              </span>
            </div>
            <div className="px-2 mt-4 mb-2">
              <button
                onClick={handleGoBack}
                className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-100 hover:bg-accent-dark/70 hover:text-white w-full">
                <ChevronLeft
                  className="mr-4 flex-shrink-0 h-6 w-6 text-gray-300"
                  aria-hidden="true"
                />
                Back
              </button>
            </div>
            <nav className="mt-2 px-2 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      active
                        ? "bg-accent-dark text-white"
                        : "text-gray-100 hover:bg-accent-dark/70 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}>
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        active
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white"
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
