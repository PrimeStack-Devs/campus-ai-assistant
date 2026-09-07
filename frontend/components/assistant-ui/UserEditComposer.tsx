'use client';

import { ComposerPrimitive } from '@assistant-ui/react';

export function UserEditComposer() {
  return (
    <ComposerPrimitive.Root className="my-2.5 flex w-full flex-col items-end animate-fade-in-up duration-200">
      <div className="w-full max-w-[85%] sm:max-w-md rounded-2xl rounded-br-xs border border-indigo-500/60 dark:border-indigo-500/50 bg-white dark:bg-slate-900 p-3 shadow-lg shadow-indigo-500/10">
        <ComposerPrimitive.Input
          autoFocus
          rows={1}
          className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none leading-relaxed min-h-[38px]"
        />
        <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
          <ComposerPrimitive.Cancel className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-3.5 py-1 text-xs font-medium text-white transition-all cursor-pointer shadow-xs active:scale-95">
            Update
          </ComposerPrimitive.Send>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
}
