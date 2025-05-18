import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Activity, MessageCircle, UserPlus } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user profile to check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/chat');
  }

  // Fetch dashboard metrics
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  const { count: newUsersThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Fetch recent activities
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-accent">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <h3 className="text-2xl font-bold text-accent">{totalUsers ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Activity className="text-green-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Users</p>
            <h3 className="text-2xl font-bold text-accent">{activeUsers ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <MessageCircle className="text-purple-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Conversations</p>
            <h3 className="text-2xl font-bold text-accent">{totalConversations ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <UserPlus className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">New Users (30d)</p>
            <h3 className="text-2xl font-bold text-accent">{newUsersThisMonth ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold text-accent mb-4">Recent Users</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-right p-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.first_name} {user.last_name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2 text-right">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold text-accent mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full bg-accent text-white p-2 rounded hover:bg-accent-light transition">
              Manage Users
            </button>
            <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
              View Conversations
            </button>
            <button className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}