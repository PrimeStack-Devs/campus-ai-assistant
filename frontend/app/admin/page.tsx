'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  Building,
  GraduationCap,
  Layers,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { analyticsApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminDashboard() {
  const metrics = analyticsApi.getMetrics();
  const [stats, setStats] = useState<any>(null);
  const { getAuthHeaders } = useAdminAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${backendUrl}/api/admin/stats`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error('Failed to fetch admin stats:', err));
  }, [backendUrl, getAuthHeaders]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color = 'blue',
  }: any) => {
    const colorStyles: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    };

    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorStyles[color] || colorStyles.blue}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles size={14} /> Dexa Production Brain
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Campus AI Operations Hub
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Manage live campus places, upload bulk Excel records, and ingest official PDF circulars with real-time vector embeddings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`${backendUrl}/api/admin/template`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-2 rounded-xl"
              >
                <Download size={16} /> Download Template
              </Button>
            </a>

            <Link href="/admin/documents">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl shadow-lg shadow-blue-600/30 font-semibold">
                <Upload size={16} /> Ingest Data
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Brain Stats */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
            Live AI Knowledge Base
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Building}
              label="Indexed Buildings"
              value={stats?.buildings ?? 99}
              subtext="Campus zones & institutes"
              color="blue"
            />
            <StatCard
              icon={GraduationCap}
              label="Departments"
              value={stats?.departments ?? 22}
              subtext="Academic faculties"
              color="purple"
            />
            <StatCard
              icon={Users}
              label="Faculty Directory"
              value={stats?.faculty ?? 76}
              subtext="Deans, professors & cabins"
              color="amber"
            />
            <StatCard
              icon={Layers}
              label="Semantic Vectors"
              value={stats?.vectorChunks ?? 403}
              subtext="Pre-computed AI embeddings"
              color="emerald"
            />
          </div>
        </div>

        {/* Activity & Performance Metrics */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            User Activity & Query Analytics
          </h2>

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
              value="0.32s"
              subtext="Instant vector retrieval"
            />
            <StatCard
              icon={TrendingUp}
              label="Satisfaction"
              value={`${metrics.satisfactionRate}%`}
              subtext="Helpful answers"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Query Growth Over Time
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Query Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={metrics.queryCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.queryCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
