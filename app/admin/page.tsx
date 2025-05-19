"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Search, User, Check, X, ArrowLeft, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { getAllUsers, UserProfile, updateUserRole } from "@/lib/auth-utils";

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getAllUsers();
        if (usersData) {
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    setUpdateLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        return;
      }
      
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { data, error } = await supabase
        .rpc('set_user_as_admin', { 
          admin_id: session.user.id, 
          target_user_id: userId 
        });
      
      if (error) {
        console.error('Error updating user role:', error);
        return;
      }
      
      if (currentRole === 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error demoting admin user:', updateError);
          return;
        }
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'user' | 'admin' } : user
      ));
    } catch (error) {
      console.error('Error toggling role:', error);
    } finally {
      setUpdateLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchTermLower) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTermLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTermLower)) ||
      (user.address && user.address.toLowerCase().includes(searchTermLower))
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <header className="bg-accent text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/chat" className="flex items-center gap-1 text-sm hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-6">User Management</h2>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-accent text-white rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={`${user.first_name}'s avatar`} className="h-10 w-10 rounded-full" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name || 'N/A'} {user.last_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.address ? (
                              <span className="text-gray-700">{user.address}</span>
                            ) : (
                              <span className="text-gray-400 italic">No address provided</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRoleToggle(user.id, user.role)}
                            disabled={updateLoading === user.id}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              user.role === 'admin'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            } focus:outline-none hover:bg-opacity-80 transition-colors`}
                          >
                            {updateLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : user.role === 'admin' ? (
                              <Check className="h-4 w-4 mr-1" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No users found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 