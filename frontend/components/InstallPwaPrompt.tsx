'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'dexa_pwa_prompt_dismissed_until';
const GUEST_DISMISS_KEY = 'dexa_guest_popup_dismissed_until';
const SNOOZE_DAYS = 7;

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 3. Check snooze period for PWA install prompt
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Helper: Checks if the guest visitor popup is pending or currently active
    const isGuestPopupActive = () => {
      try {
        const guestDismissed = localStorage.getItem(GUEST_DISMISS_KEY);
        // If dismissed within the last 24h, guest popup won't show
        if (guestDismissed && Number(guestDismissed) > Date.now()) {
          return false;
        }
      } catch {}
      return true;
    };

    // Helper: Safely schedules showing the PWA prompt without colliding with the guest notice
    const schedulePwaPrompt = () => {
      if (isGuestPopupActive()) {
        // Guest notice is active or pending -> wait until it is dismissed
        const handleGuestClosed = () => {
          window.removeEventListener('dexa_guest_popup_closed', handleGuestClosed);
          // Give the user a relaxed 3-second breathing room after closing guest notice
          setTimeout(() => {
            setIsVisible(true);
          }, 3000);
        };
        window.addEventListener('dexa_guest_popup_closed', handleGuestClosed);
      } else {
        // Guest notice already handled or logged in -> show after a pleasant delay
        setTimeout(() => {
          setIsVisible(true);
        }, 7000);
      }
    };

    // 4. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) &&
      !/chrome|crios|fxios|edgios/.test(userAgent);

    if (isAppleDevice && isSafari) {
      setIsIos(true);
      schedulePwaPrompt();
      return;
    }

    // 5. Android / Chrome / Edge beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      schedulePwaPrompt();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    // Snooze for 7 days
    const snoozeUntil = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(snoozeUntil));
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Install application prompt"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in-up duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 shadow-xl shadow-indigo-500/10">
        {/* Subtle decorative accent glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          {/* App Icon Badge */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25 mt-0.5">
            <Sparkles size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Install Dexa AI
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              Add to your home screen for full-screen mode and instant access without browser bars.
            </p>

            {/* iOS Specific Instructions */}
            {isIos && showIosGuide && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 animate-fade-in-up duration-200">
                <p className="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-300">
                  <Share size={13} className="shrink-0" />
                  1. Tap the <strong className="font-semibold">Share</strong> button at bottom
                </p>
                <p className="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-300">
                  <PlusSquare size={13} className="shrink-0" />
                  2. Scroll & select <strong className="font-semibold">&ldquo;Add to Home Screen&rdquo;</strong>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Download size={13} />
                <span>{isIos && !showIosGuide ? 'How to Install' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
