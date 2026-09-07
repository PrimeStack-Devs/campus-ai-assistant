'use client';

import { LocationCard } from './LocationCard';
import { SourceCard } from './SourceCard';
import type { LocationData, WebSourceData } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  location?: LocationData;
  webSource?: WebSourceData;
}

export function MessageBubble({
  content,
  isUser,
  timestamp,
  location,
  webSource,
}: MessageBubbleProps) {
  return (
    <div
      className={`mb-6 flex ${
        isUser ? 'justify-end' : 'justify-start'
      } animate-fade-in-up duration-300`}
    >
      <div
        className={
          isUser
            ? 'max-w-[85%] sm:max-w-md'
            : 'w-full max-w-full sm:max-w-2xl'
        }
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-base ${
            isUser
              ? 'rounded-br-xs bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'rounded-bl-xs bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
          }`}
        >
          {isUser ? (
            <div className="text-white font-medium break-words whitespace-pre-wrap select-text">
              {content}
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto break-words prose prose-slate dark:prose-invert [&_a]:break-all [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:font-semibold [&_a]:underline hover:[&_a]:text-indigo-500 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_ul]:pl-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          {timestamp && (
            <p
              className={`mt-1.5 text-[10px] font-semibold text-right ${
                isUser ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {timestamp}
            </p>
          )}
        </div>

        {!isUser && location?.name && <LocationCard location={location} />}
        {!isUser && webSource?.sourceUrl && <SourceCard source={webSource} />}
      </div>
    </div>
  );
}
