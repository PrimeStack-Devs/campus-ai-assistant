'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'AccessDenied';
  const domain = searchParams.get('domain');
  const allowed = searchParams.get('allowed') || '@paruluniversity.ac.in';

  let title = 'Authentication Restricted';
  let description =
    'Your Google account could not be signed in to Dexa Campus AI.';

  if (error === 'DomainRestricted') {
    title = 'University Account Required';
    description = `Administration requires students and staff to log in with an authorized campus domain (${allowed}).`;
  } else if (error === 'AuthDisabled') {
    title = 'Google Sign-In Disabled';
    description =
      'Google authentication is temporarily disabled by university administration.';
  } else if (error === 'Configuration') {
    title = 'OAuth Credentials Needed';
    description =
      'Google Client ID or Client Secret has not been configured in the frontend .env file.';
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 shadow-xs">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {error === 'DomainRestricted' && domain && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Building2 size={16} className="text-amber-600" />
              <span>Domain Verification Failed</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300">
              Attempted domain: <code className="font-mono font-bold text-rose-600 dark:text-rose-400">@{domain}</code>
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              Authorized domain: <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{allowed}</code>
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Switch Google Account</span>
          </Button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Continue as Campus Guest</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
          Loading authentication status...
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
