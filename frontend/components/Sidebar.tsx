'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, Info, MapPin, MessageCircle } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/campus-info', label: 'Campus Info', icon: MapPin },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-slate-200 bg-white/95 px-2 py-1 text-slate-900 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-white md:static md:h-dvh md:w-64 md:flex-col md:border-r md:border-t-0 md:bg-linear-to-b md:from-white md:via-slate-50 md:to-slate-100 md:p-6 md:shadow-none md:dark:from-slate-950 md:dark:via-slate-900 md:dark:to-slate-900">
      <div className="mb-8 hidden md:block">
        <h1 className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
          Dexa AI
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your campus assistant</p>
      </div>

      <nav className="grid w-full grid-cols-5 gap-1 md:block md:flex-1 md:space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center transition-all md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 md:h-4 md:w-4" aria-hidden="true" />
              <span className="max-w-full truncate text-[11px] font-medium leading-tight md:text-base">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-200 pt-6 dark:border-slate-800 md:block">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">HireMnd</p>
      </div>
    </aside>
  );
}
