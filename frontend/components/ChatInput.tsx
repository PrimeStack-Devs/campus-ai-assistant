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
    <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border-t border-gray-200">
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about campus..."
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onSubmit('What events are coming up?')}
          disabled={disabled}
          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-400"
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => onSubmit('Where is the library?')}
          disabled={disabled}
          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-400"
        >
          Facilities
        </button>
        <button
          type="button"
          onClick={() => onSubmit('Tell me about clubs')}
          disabled={disabled}
          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-400"
        >
          Clubs
        </button>
      </div>
    </form>
  );
}
