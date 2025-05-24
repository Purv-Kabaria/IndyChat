"use client";

import { ReactNode } from "react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-100">
        <AdminNavigation />

        <div className="lg:pl-64">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
} 