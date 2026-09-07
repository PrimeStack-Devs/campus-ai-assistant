'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  X,
  Lock,
  MessageSquare,
  Users,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_STORAGE_KEY = 'dexa_guest_popup_dismissed_until';
const POPUP_DELAY_MS = 3500;

export default function GuestUnlockPopup() {
  const { user, loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // If user is already logged in, do not show
    if (user) return;

    // Check if dismissed within last 24 hours
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {}

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user]);

  // Don't render on server, when logged in, or when closed
  if (!mounted || user || !isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      // Dismiss for 24 hours
      localStorage.setItem(
        DISMISS_STORAGE_KEY,
        String(Date.now() + 24 * 60 * 60 * 1000)
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dexa_guest_popup_closed'));
      }
    } catch {}
  };

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Popup Google Sign-in error:', err);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/80 dark:border-blue-500/20 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl p-5 sm:p-6 space-y-4">
        {/* Glow background accent */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close suggestion popup"
        >
          <X size={16} />
        </button>

        {/* Header with Sparkle Badge */}
        <div className="space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-[11px] font-bold text-blue-700 dark:text-blue-300">
            <Sparkles size={12} className="text-amber-500 fill-amber-500" />
            <span>Campus AI Guest Notice</span>
          </div>
          <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            Unlock Full Campus Access
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You are browsing in Visitor mode. Sign in with Google to get the complete experience:
          </p>
        </div>

        {/* 3 Value Highlights */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <MessageSquare size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Unlimited AI Assistant</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Unlimited questions & chat history saved across your devices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Users size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Official Faculty Directory</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct faculty emails, phone extensions, and cabin locations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <CalendarDays size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Exam Schedules & Deadlines</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Semester milestone dates, internal exam windows, and circulars.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={handleSignIn}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {/* Google G Icon */}
            <svg className="h-4 w-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
            <span>Sign In with Google</span>
            <ArrowRight size={14} />
          </Button>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              Verified University Access
            </span>
            <button
              onClick={handleDismiss}
              className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
