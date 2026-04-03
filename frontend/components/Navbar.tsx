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
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-md shadow-blue-500/20">
          User
        </button>
      </div>
    </nav>
  );
}
