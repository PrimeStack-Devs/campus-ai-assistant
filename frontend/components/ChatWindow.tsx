'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { LocationData, WebSourceData } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  location?: LocationData;
  webSource?: WebSourceData;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:space-y-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-3 text-center">
            <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">Dexa</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">Welcome to Campus AI</h3>
            <p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300 sm:max-w-md sm:text-base">
              Ask me anything about campus events, facilities, clubs, academics, or contacts. I&apos;m here to help!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
                location={message.location}
                webSource={message.webSource}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <TypingIndicator />
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
