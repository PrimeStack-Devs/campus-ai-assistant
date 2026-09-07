'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  FileText,
  MapPin,
  Calendar,
  Building2,
  LogOut,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout, isLoading } = useAdminAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Route Guard: Redirect unauthenticated visits to /admin/login
  useEffect(() => {
    if (!isLoading && !admin && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [admin, isLoading, pathname, router]);

  const isDark = mounted && resolvedTheme === 'dark';

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/facilities', label: 'Facilities', icon: Building2 },
    { href: '/admin/clubs', label: 'Clubs', icon: Users },
    { href: '/admin/contacts', label: 'Contacts', icon: FileText },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/documents', label: 'Documents', icon: FileText },
    { href: '/admin/settings', label: 'Auth Settings', icon: Settings },
  ];

  // While checking auth status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400 font-medium">
            Verifying admin credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated, wait for router redirect
  if (!admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-900 text-white border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/30">
              PU
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Campus Admin</h1>
              <p className="text-xs text-slate-400">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <Link
            href="/home"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors text-xs font-medium"
          >
            <span>Back to Campus AI</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-slate-50 dark:bg-slate-950">
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Admin Dashboard
              </h2>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {mounted
                  ? new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Campus Operations Hub'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Authenticated Admin Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span className="truncate max-w-[160px]">{admin.email}</span>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun size={17} className="text-amber-400" />
                ) : (
                  <Moon size={17} />
                )}
              </button>

              {/* Header Sign Out */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-all cursor-pointer"
                title="Sign out of Admin Portal"
              >
                <LogOut size={14} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">{children}</div>
      </main>
    </div>
  );
}
