'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Mail, Linkedin, Sparkles, ExternalLink, Code2, Smartphone } from 'lucide-react';

interface DeveloperTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperTeamModal({ isOpen, onClose }: DeveloperTeamModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] sm:w-full max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-[88vh] flex flex-col gap-0 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:opacity-100 [&>[data-slot=dialog-close]]:top-3.5 [&>[data-slot=dialog-close]]:right-3.5 sm:[&>[data-slot=dialog-close]]:top-4 sm:[&>[data-slot=dialog-close]]:right-4">
        {/* Decorative Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-violet-600 to-sky-600 px-4 py-3.5 sm:px-6 sm:py-4 text-white overflow-hidden shrink-0 pr-11 sm:pr-12">
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner shrink-0">
              <Sparkles size={18} className="text-cyan-200 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              {/* <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Meet the Builders
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-indigo-100/90 mt-0.5 leading-tight truncate sm:whitespace-normal">
                The Engineering Team behind Kryvix Campus AI
              </DialogDescription> */}
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Contact & Support
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-indigo-100/90 mt-0.5 leading-tight truncate sm:whitespace-normal">
                Reach out to developer for feedback or help
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3.5 overflow-y-auto overscroll-contain flex-1">
          {/* Developers info currently commented out */}
          {/*
          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all group">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 shrink-0">
                DD
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    Deepak Dhakad
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] sm:text-[10px] font-semibold">
                    <Code2 size={10} className="mr-1 inline shrink-0" />
                    Lead
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  Lead Full-Stack AI Engineer
                </p>
              </div>
            </div>

            <p className="mt-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Architected and engineered the end-to-end web platform, Node.js backend, LangGraph multi-agent RAG workflow, vector search, Redis caching layer, and real-time web search fallback.
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-1.5 sm:gap-2">
              <a
                href="mailto:deepakdkd1188@gmail.com"
                className="flex-1 min-w-0 flex items-center justify-center min-[380px]:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] sm:text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Mail size={12} className="shrink-0" />
                <span className="truncate">deepakdkd1188@gmail.com</span>
              </a>

              <a
                href="https://www.linkedin.com/in/deepak-dhakad-web-developer/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <Linkedin size={12} className="shrink-0" />
                <span>LinkedIn</span>
                <ExternalLink size={10} className="shrink-0" />
              </a>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-900/50 transition-all group">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 shrink-0">
                JP
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    Jatin Puri
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[9px] sm:text-[10px] font-semibold">
                    <Smartphone size={10} className="mr-1 inline shrink-0" />
                    Mobile
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  Mobile App Developer
                </p>
              </div>
            </div>

            <p className="mt-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Engineered the native campus mobile application, delivering responsive campus navigation, timetable access, and real-time AI assistance directly into students&apos; hands.
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-1.5 sm:gap-2">
              <a
                href="mailto:purijatinn@gmail.com"
                className="flex-1 min-w-0 flex items-center justify-center min-[380px]:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] sm:text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Mail size={12} className="shrink-0" />
                <span className="truncate">purijatinn@gmail.com</span>
              </a>
              <a
                href="https://www.linkedin.com/in/deepak-dhakad-web-developer/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <Linkedin size={13} />
                <span>LinkedIn</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
          */}

          {/* Contact Developer */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Contact Developer
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
              For any feedback, questions, or help regarding Kryvix, please contact:
            </p>
            <div className="pt-2 flex justify-center">
              <a
                href="mailto:deepakdkd1188@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Mail size={13} />
                <span>deepakdkd1188@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick Note */}
          <div className="p-2.5 rounded-lg sm:rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
            <p className="text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              💡 Have feedback, found an issue with campus data, or want to suggest a new feature? Reach out to the developer for any feedback or help!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
