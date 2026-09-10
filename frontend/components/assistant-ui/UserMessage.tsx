'use client';

import { MessagePrimitive, ActionBarPrimitive } from '@assistant-ui/react';
import { Pencil, Copy, Check } from 'lucide-react';

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="group mb-4 sm:mb-5 flex justify-end animate-fade-in-up duration-250">
      <div className="flex flex-col items-end max-w-[85%] sm:max-w-md">
        <div className="rounded-2xl rounded-br-xs bg-gradient-to-tr from-indigo-600 to-violet-600 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-white shadow-md shadow-indigo-500/20 break-words whitespace-pre-wrap select-text leading-relaxed">
          <MessagePrimitive.Content />
        </div>

        {/* Action bar: visible on mobile, reveal on hover on desktop */}
        <div className="chat-action-bar flex items-center gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <ActionBarPrimitive.Root className="flex items-center gap-0.5">
            <ActionBarPrimitive.Edit
              className="p-1.5 sm:p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              title="Edit message"
            >
              <Pencil size={12} />
              <span className="text-[10.5px] font-medium">Edit</span>
            </ActionBarPrimitive.Edit>

            <ActionBarPrimitive.Copy
              copiedDuration={2000}
              className="group/btn p-1.5 sm:p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              title="Copy message"
            >
              <Copy size={12} className="group-data-[copied=true]/btn:hidden" />
              <Check size={12} className="hidden group-data-[copied=true]/btn:inline text-emerald-500" />
              <span className="text-[10.5px] font-medium group-data-[copied=true]/btn:text-emerald-500">
                Copy
              </span>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
