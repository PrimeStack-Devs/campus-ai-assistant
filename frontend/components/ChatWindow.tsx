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
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-5xl">Dexa</div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome to Campus AI</h3>
            <p className="max-w-md text-slate-600 dark:text-slate-300">
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
