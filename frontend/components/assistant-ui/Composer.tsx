'use client';

import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { Send, Square, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComposerProps {
  disabled?: boolean;
  isGuest?: boolean;
  remainingGuestMessages?: number;
  isGuestLimitReached?: boolean;
  onSignIn?: () => void;
}

export function Composer({
  disabled = false,
  isGuest = false,
  remainingGuestMessages = 5,
  isGuestLimitReached = false,
  onSignIn,
}: ComposerProps) {
  // 1. Guest limit reached locked state
  if (isGuestLimitReached) {
    return (
      <div className="border-t border-slate-200/50 bg-white/80 p-3 sm:p-4 dark:border-slate-800/50 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
        <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200 dark:border-indigo-800/60 text-center space-y-2.5 shadow-lg">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md mx-auto">
            <Lock size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Guest Question Limit Reached (5/5)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              You’ve used all 5 free visitor queries. Sign in with your Google account to unlock unlimited questions, persistent conversation history, and cloud sync.
            </p>
          </div>
          <div className="pt-1">
            <Button
              onClick={onSignIn}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-xs inline-flex items-center gap-2"
            >
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
              <span>Sign In with Google (Unlimited)</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Composer
  return (
    <div className="border-t border-slate-200/50 bg-white/70 px-3.5 py-2 sm:p-2.5 dark:border-slate-800/50 dark:bg-slate-950/70 backdrop-blur-md shrink-0">
      <div className="max-w-3xl mx-auto w-full">
        {/* Guest Query Counter Badge */}
        {isGuest && (
          <div className="mb-1.5 flex items-center justify-between px-1 text-[10.5px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Guest Mode:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {remainingGuestMessages} of 5 free queries
              </strong>{' '}
              remaining
            </span>
            <button
              type="button"
              suppressHydrationWarning
              onClick={onSignIn}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Sign in for unlimited
            </button>
          </div>
        )}

        <ComposerPrimitive.Root className="relative flex items-end gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 sm:p-1.5 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 dark:border-slate-800/80 dark:bg-slate-900/60">
          <ComposerPrimitive.Input
            placeholder="Ask me anything about campus..."
            disabled={disabled}
            submitMode="enter"
            rows={1}
            maxRows={6}
            className="min-w-0 flex-1 resize-none bg-transparent px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:text-slate-500 leading-relaxed max-h-[140px] overflow-y-auto break-words"
          />

          {/* Send / Stop Buttons */}
          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send
              disabled={disabled}
              className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 h-8.5 w-8.5 sm:h-9 sm:w-9 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-500 cursor-pointer self-end mb-0.5"
              aria-label="Send message"
            >
              <Send size={15} />
            </ComposerPrimitive.Send>
          </ThreadPrimitive.If>

          <ThreadPrimitive.If running={true}>
            <ComposerPrimitive.Cancel
              className="shrink-0 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white h-8.5 w-8.5 sm:h-9 sm:w-9 text-white dark:text-slate-900 shadow-md transition-all active:scale-95 cursor-pointer self-end mb-0.5"
              aria-label="Stop generation"
            >
              <Square size={13} className="fill-current" />
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </ComposerPrimitive.Root>

        {/* Subtle keyboard hint for desktop */}
        <div className="hidden sm:flex items-center justify-between px-2 pt-1 text-[10px] text-slate-400 dark:text-slate-500">
          <span>Dexa AI answers campus queries in real time.</span>
          <span className="font-mono text-[9.5px] text-slate-400/80 dark:text-slate-500">
            Shift + Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
