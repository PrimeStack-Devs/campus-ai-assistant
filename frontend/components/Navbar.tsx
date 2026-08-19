'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <nav className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/50 bg-white/70 px-4 py-3 shadow-xs backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70 sm:px-6 sm:py-4">
      <h2 className="min-w-0 truncate text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">{title}</h2>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-850 sm:h-10 sm:w-10"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Moon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all duration-200 active:scale-95 sm:h-10 sm:w-10 sm:text-sm">
          PU
        </button>
      </div>
    </nav>
  );
}
