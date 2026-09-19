'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Shield,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Mail,
  UserCheck,
  Building,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface UserItem {
  googleId?: string;
  name: string;
  email: string;
  avatar?: string;
  domain?: string;
  role: string;
  lastLogin?: string;
  createdAt?: string;
}

interface Analytics {
  totalUsers: number;
  activeToday: number;
  roles: Record<string, number>;
  domains: Record<string, number>;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'student',
  });
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { getAuthHeaders } = useAdminAuth();
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('search', searchQuery);
      if (roleFilter !== 'all') queryParams.set('role', roleFilter);

      const res = await fetch(
        `${backendUrl}/api/admin/users?${queryParams.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (email: string, newRole: string) => {
    try {
      const res = await fetch(
        `${backendUrl}/api/admin/users/${encodeURIComponent(email)}/role`,
        {
          method: 'PATCH',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.email === email ? { ...u, role: newRole } : u))
        );
        setFeedback({
          type: 'success',
          message: `User role updated to ${newRole}.`,
        });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update role.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating role.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${backendUrl}/api/admin/users/${encodeURIComponent(deleteTarget.email)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.email !== deleteTarget.email));
        setFeedback({
          type: 'success',
          message: `User ${deleteTarget.name} deleted from database.`,
        });
        setTimeout(() => setFeedback(null), 3500);
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserForm.name.trim(),
          email: newUserForm.email.trim().toLowerCase(),
          role: newUserForm.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewUserForm({ name: '', email: '', role: 'student' });
        fetchUsers();
        setFeedback({ type: 'success', message: 'User added to database successfully.' });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to create user.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                User &amp; Student Accounts
              </h1>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border dark:border-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck size={12} /> Database Synced
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage student, faculty, and administrative users synchronized across MongoDB Atlas and the persistent data store.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchUsers()}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 text-xs font-semibold rounded-xl"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              <Plus size={16} />
              Add User Account
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Live Analytics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {analytics?.totalUsers ?? users.length}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Students</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {analytics?.roles?.student ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 rounded-lg">
              <Building size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Faculty &amp; Staff</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {analytics?.roles?.faculty ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Today</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {analytics?.activeToday ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search users by name, email, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['all', 'student', 'faculty', 'admin', 'user'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
              <p className="text-xs text-slate-500 font-medium">Loading user records from database...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users className="mx-auto text-slate-400" size={32} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No users found
              </p>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or role filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr
                      key={user.email}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                              {user.name ? user.name[0] : 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {user.name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {user.googleId ? `ID: ${user.googleId.slice(0, 14)}...` : 'Local User'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {user.email}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                            user.domain?.includes('parul')
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          @{user.domain || user.email.split('@')[1]}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.email, e.target.value)}
                          className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                            user.role === 'student'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : user.role === 'faculty'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                              : user.role === 'admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {formatDate(user.lastLogin || user.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => setDeleteTarget(user)}
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 h-7.5 w-7.5 p-0 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        title="Add New User Account"
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateUser}
        submitLabel="Create User"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. student@paruluniversity.ac.in"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Role
            </label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
              <option value="user">Standard User</option>
            </select>
          </div>
        </div>
      </AdminModal>

      {/* Delete User Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          isOpen={Boolean(deleteTarget)}
          title="Confirm User Account Deletion"
          onClose={() => setDeleteTarget(null)}
          onSubmit={handleDeleteUser}
          submitLabel="Delete User"
          submitVariant="danger"
          isLoading={isSubmitting}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong>{deleteTarget.name}</strong> (<code>{deleteTarget.email}</code>)?
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              This will remove the user record from both the MongoDB Atlas database and local persistent storage.
            </p>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
}
