'use client';

import { Moon, Sun, LogOut, ChevronDown, Sparkles, MapPin, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout, setIsLoginModalOpen } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <nav className="relative z-40 flex h-13 sm:h-14 items-center justify-between gap-3 border-b border-slate-200/50 bg-white/70 px-3.5 sm:px-5 py-2 shadow-xs backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70 shrink-0">
      <h2 className="min-w-0 truncate text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {/* Theme Toggle */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-850 cursor-pointer"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User Auth Status / Google Sign-In */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              suppressHydrationWarning
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : user.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  'U'
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-bold leading-tight text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user.name}
                </p>
                <p className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-medium leading-none mt-0.5">
                  {user.domain?.includes('parul') ? 'PU Student' : 'Google User'}
                </p>
              </div>
              <ChevronDown
                size={13}
                className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu (Guaranteed above all page content with z-50 and relative nav z-40) */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header User Card */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : user.name ? (
                        user.name[0].toUpperCase()
                      ) : (
                        'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>
                      {user.domain?.includes('parul')
                        ? 'Verified University Account'
                        : 'Google Account Connected'}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-0.5 pt-1">
                  <Link
                    href="/chat"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    <Sparkles size={14} className="text-blue-500" />
                    <span>AI Campus Assistant</span>
                  </Link>
                  <Link
                    href="/campus-info"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    <MapPin size={14} className="text-emerald-500" />
                    <span>Campus Directory</span>
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            suppressHydrationWarning
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            {/* Google G Icon */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Sign In with Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
