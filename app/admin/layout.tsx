import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation sidebar */}
        <AdminNavigation />

        {/* Main content area with proper padding for sidebar */}
        <div className="lg:pl-64">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
} 