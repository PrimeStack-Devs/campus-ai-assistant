'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/campus-info', label: 'Campus Info', icon: '📍' },
    { href: '/events', label: 'Events', icon: '📅' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-linear-to-b from-white via-slate-50 to-slate-100 p-6 text-slate-900 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 dark:text-white">
      <div className="mb-8">
        <h1 className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
          Dexa AI
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your campus assistant</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-wide">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">HireMnd</p>
      </div>
    </aside>
  );
}
