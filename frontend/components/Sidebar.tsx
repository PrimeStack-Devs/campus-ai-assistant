'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <aside className="fixed bottom-4 inset-x-4 md:inset-x-auto z-20 flex h-16 rounded-2xl md:rounded-none border border-slate-200/80 bg-white/85 px-3 py-1.5 text-slate-900 shadow-xl shadow-slate-200/20 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/85 dark:text-white dark:shadow-black/40 md:static md:h-dvh md:w-52 lg:w-56 md:flex-col md:border-r md:border-t-0 md:border-slate-200/50 md:bg-linear-to-b md:from-white/70 md:via-slate-50/50 md:to-slate-100/50 md:p-4 md:shadow-none md:dark:border-slate-800/50 md:dark:from-slate-950/70 md:dark:via-slate-900/50 md:dark:to-slate-900/50 shrink-0">
      <Link href="/" className="mb-6 hidden md:flex items-center gap-3 group">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06063c] border border-cyan-500/20 shadow-md shadow-cyan-500/10 transition-transform duration-200 group-hover:scale-105">
          <Image
            src="/logo-mark.png"
            alt="Kryvix AI Logo"
            width={30}
            height={30}
            className="drop-shadow-[0_0_8px_rgba(0,240,255,0.35)]"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-base font-black tracking-wider text-transparent">
              KRYVIX
            </span>
            <span className="rounded px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 leading-none">
              AI
            </span>
          </div>
          <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 truncate">Campus Assistant</p>
        </div>
      </Link>

      <nav className="grid w-full grid-cols-5 gap-1.5 md:block md:flex-1 md:space-y-1.5">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' || pathname === '/home' : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 text-center transition-all duration-200 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:py-2.5 md:text-left ${isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 dark:shadow-indigo-500/15'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <Icon className={`h-5 w-5 shrink-0 md:h-4 md:w-4 transition-transform duration-250 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold leading-tight md:text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-200/50 pt-4 dark:border-slate-800/50 md:block">
        <p className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">HireMind</p>
      </div>
    </aside>
  );
}
