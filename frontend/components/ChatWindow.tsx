'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Sparkles, MapPin, Coffee, BookOpen, User, ArrowRight } from 'lucide-react';
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
  onSuggest?: (message: string) => void;
}

export function ChatWindow({ messages, isLoading, onSuggest }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const defaultSuggestions = [
    {
      label: 'Find Building',
      q: 'Where is the CV Raman building?',
      desc: 'Get walk directions & GPS map coordinates',
      icon: MapPin,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400',
    },
    {
      label: 'Canteen Services',
      q: 'Which food court canteens are open now?',
      desc: 'Check dining availability & location details',
      icon: Coffee,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
    },
    {
      label: 'Academics Rules',
      q: 'What is the attendance backlog policy?',
      desc: 'Verify GPA requirements & attendance limits',
      icon: BookOpen,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
    },
    {
      label: 'HOD Contact',
      q: 'Who is the HOD of Computer Science?',
      desc: 'Find office floor number, email, and extension',
      icon: User,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/20 via-transparent to-transparent dark:from-rose-950/5 pointer-events-none" />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:space-y-6 sm:p-8 relative z-10">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-6 px-3">
            
            {/* AI Avatar badge */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 animate-pulse duration-3000">
              <Sparkles className="h-8 w-8" />
            </div>

            <h3 className="mb-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Meet Dexa, Your Assistant
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400 text-center mb-10 font-medium">
              Ask anything about Parul University buildings, hostels, policies, faculty members, or upcoming events.
            </p>

            {/* Quick Cards Grid */}
            <div className="grid w-full max-w-2xl grid-cols-1 gap-3.5 sm:grid-cols-2">
              {defaultSuggestions.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSuggest?.(item.q)}
                    className="group flex flex-col items-start rounded-2xl border border-slate-200/60 bg-white p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:border-rose-400 hover:shadow-lg hover:shadow-slate-100 dark:border-slate-800/80 dark:bg-slate-900/10 dark:hover:bg-slate-900/50 dark:hover:shadow-none"
                  >
                    <div className="flex w-full items-center justify-between mb-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                        <IconComp className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-500 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      &ldquo;{item.q}&rdquo;
                    </p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>

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
