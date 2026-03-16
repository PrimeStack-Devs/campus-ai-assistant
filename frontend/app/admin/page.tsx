'use client';

import { Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { analyticsApi } from '@/lib/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const metrics = analyticsApi.getMetrics();

  const StatCard = ({ icon: Icon, label, value, subtext }: any) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <Icon className="text-blue-600" size={24} />
        </div>
      </div>
    </div>
  );

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            subtext={`${metrics.activeUsers} active today`}
          />
          <StatCard
            icon={MessageSquare}
            label="Total Queries"
            value={metrics.totalQueries.toLocaleString()}
            subtext="This month"
          />
          <StatCard
            icon={Clock}
            label="Avg Response Time"
            value={`${metrics.averageResponseTime}s`}
            subtext="Very fast"
          />
          <StatCard
            icon={TrendingUp}
            label="Satisfaction"
            value={`${metrics.satisfactionRate}%`}
            subtext="User satisfaction"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Query Categories */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Query Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.queryCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.queryCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">System Status</h3>
            <p className="text-slate-600">All systems operational. Last update: 2 minutes ago.</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Performance</h3>
            <p className="text-slate-600">API response time improved by 15% this week.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
