'use client';

import { MessagePrimitive, ActionBarPrimitive } from '@assistant-ui/react';
import { Pencil } from 'lucide-react';

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="group mb-4 sm:mb-5 flex justify-end animate-fade-in-up duration-250">
      <div className="flex flex-col items-end max-w-[85%] sm:max-w-md">
        <div className="rounded-2xl rounded-br-xs bg-gradient-to-tr from-indigo-600 to-violet-600 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-white shadow-md shadow-indigo-500/20 break-words whitespace-pre-wrap select-text leading-relaxed">
          <MessagePrimitive.Content />
        </div>

        {/* Action bar on hover */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBarPrimitive.Root>
            <ActionBarPrimitive.Edit className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-[11px] flex items-center gap-1 cursor-pointer">
              <Pencil size={12} />
              <span className="text-[10px]">Edit</span>
            </ActionBarPrimitive.Edit>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
