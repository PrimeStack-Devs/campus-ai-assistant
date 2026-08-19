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
    <aside className="fixed bottom-4 inset-x-4 md:inset-x-auto z-20 flex h-16 rounded-2xl md:rounded-none border border-slate-200/80 bg-white/85 px-3 py-1.5 text-slate-900 shadow-xl shadow-slate-200/20 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/85 dark:text-white dark:shadow-black/40 md:static md:h-dvh md:w-64 md:flex-col md:border-r md:border-t-0 md:border-slate-200/50 md:bg-linear-to-b md:from-white/70 md:via-slate-50/50 md:to-slate-100/50 md:p-6 md:shadow-none md:dark:border-slate-800/50 md:dark:from-slate-950/70 md:dark:via-slate-900/50 md:dark:to-slate-900/50">
      <div className="mb-8 hidden md:block">
        <h1 className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-2xl font-black tracking-tight text-transparent">
          Dexa AI
        </h1>
        <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">Parul University Guide</p>
      </div>

      <nav className="grid w-full grid-cols-5 gap-1.5 md:block md:flex-1 md:space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' || pathname === '/home' : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 text-center transition-all duration-200 md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3.5 md:text-left ${isActive
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/20 dark:shadow-rose-500/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <Icon className={`h-5 w-5 shrink-0 md:h-4 md:w-4 transition-transform duration-250 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold leading-tight md:text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-200/50 pt-6 dark:border-slate-800/50 md:block">
        <p className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">HireMind</p>
      </div>
    </aside>
  );
}
