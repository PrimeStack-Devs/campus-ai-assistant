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
    <aside className="w-64 bg-linear-to-b from-slate-900 to-slate-800 text-white p-6 flex flex-col h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Campus AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">PU campus assistant</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">Team HireMind 👨‍💻</p>
      </div>
    </aside>
  );
}
