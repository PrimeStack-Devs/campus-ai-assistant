'use client';

import { useState } from 'react';

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
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about campus..."
          disabled={disabled}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          Send
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSubmit('What events are coming up?')}
          disabled={disabled}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => onSubmit('Where is the library?')}
          disabled={disabled}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Facilities
        </button>
        <button
          type="button"
          onClick={() => onSubmit('Tell me about clubs')}
          disabled={disabled}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Clubs
        </button>
      </div>
    </form>
  );
}
