'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Threads } from './backgrounds/Threads';
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
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400',
    },
    {
      label: 'Canteen Services',
      q: 'Which food court canteens are open now?',
      desc: 'Check dining availability & location details',
      icon: Coffee,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400',
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
      q: 'Who is the HOD of MCA?',
      desc: 'Find office floor number, email, and extension',
      icon: User,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400',
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-transparent dark:from-indigo-950/10 pointer-events-none" />

      <div className={`min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-8 relative z-10 ${messages.length > 0 ? 'space-y-4 sm:space-y-6' : ''}`}>
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-start sm:justify-center py-2 sm:py-6 px-1 sm:px-3 relative">
            {/* Ambient Threads Background for Welcome Screen */}
            <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-60 overflow-hidden">
              <Threads
                color={[0.42, 0.38, 0.98]}
                amplitude={1.1}
                distance={0.25}
                enableMouseInteraction={true}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto">
              {/* AI Avatar badge */}
              <div className="mb-3 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 animate-pulse duration-3000">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>

              <h3 className="mb-1 sm:mb-2 text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 text-center">
                Meet Dexa, Your Assistant
              </h3>
              <p className="max-w-xs sm:max-w-md text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 text-center mb-3 sm:mb-8 font-medium">
                Ask anything about Parul University buildings, hostels, policies, faculty members, or upcoming events.
              </p>

              {/* Quick Cards Grid */}
              <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:gap-3.5 sm:grid-cols-2">
                {defaultSuggestions.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      suppressHydrationWarning
                      onClick={() => onSuggest?.(item.q)}
                      className="group flex flex-row sm:flex-col items-center sm:items-start gap-2.5 sm:gap-0 rounded-xl sm:rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-md p-2.5 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:hover:border-indigo-700 active:scale-[0.98]"
                    >
                      <div className="flex sm:w-full items-center justify-between sm:mb-3 shrink-0">
                        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${item.color}`}>
                          <IconComp className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">
                          {item.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:hidden mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate sm:whitespace-normal">
                          &ldquo;{item.q}&rdquo;
                        </p>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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
