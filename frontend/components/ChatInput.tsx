'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200/50 bg-white/70 p-4 dark:border-slate-800/50 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all focus-within:border-rose-500 focus-within:ring-3 focus-within:ring-rose-500/10 dark:border-slate-800/80 dark:bg-slate-900/40">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about campus..."
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent px-4.5 py-3 text-sm text-slate-900 focus:outline-none disabled:text-slate-400 dark:text-slate-100 dark:disabled:text-slate-500 sm:text-base"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/15 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-500"
          aria-label="Send query"
        >
          <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </div>
    </form>
  );
}
