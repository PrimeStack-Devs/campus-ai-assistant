'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Lock, Globe, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, authConfig, loginWithGoogle } =
    useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isLoginModalOpen) return null;

  const isRestricted = Boolean(authConfig?.domainRestrictionEnabled);
  const allowedDomains = authConfig?.allowedDomains || ['paruluniversity.ac.in'];

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs mb-1">
            {/* Google Logo SVG */}
            <svg className="h-7 w-7" viewBox="0 0 24 24">
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
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign In with NextAuth & Google
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in using your Google account to sync your chat sessions and campus bookmarks.
          </p>
        </div>

        {/* Live Domain Restriction Banner */}
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
            isRestricted
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {isRestricted ? (
            <Lock className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} />
          ) : (
            <Globe className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" size={18} />
          )}
          <div className="space-y-1">
            <p className="font-bold">
              {isRestricted ? 'University Domain Policy Enforced' : 'Open Domain Policy Active'}
            </p>
            <p className="leading-relaxed opacity-90">
              {isRestricted ? (
                <>
                  Only official university Google accounts matching{' '}
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {allowedDomains.map((d) => `@${d}`).join(', ')}
                  </span>{' '}
                  are permitted. Personal accounts will be automatically rejected.
                </>
              ) : (
                'All personal Gmail and university Google accounts are currently permitted to sign in.'
              )}
            </p>
          </div>
        </div>

        {/* NextAuth Google Action Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all rounded-2xl flex items-center justify-center gap-3 cursor-pointer text-sm active:scale-98"
          >
            {isSigningIn ? (
              <>
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              Secure NextAuth Handshake
            </span>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
