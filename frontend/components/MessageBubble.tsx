'use client';

import { LocationCard } from './LocationCard';
import { SourceCard } from './SourceCard';
import type { ReactNode } from 'react';
import type { LocationData, WebSourceData } from '@/lib/api';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  location?: LocationData;
  webSource?: WebSourceData;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const SINGLE_URL_PATTERN = /^https?:\/\/[^\s]+$/;

function renderLineWithLinks(line: string): ReactNode[] {
  return line.split(URL_PATTERN).map((part, index) => {
    if (!part) return '';

    if (SINGLE_URL_PATTERN.test(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all underline underline-offset-2 hover:opacity-80"
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export function MessageBubble({ content, isUser, timestamp, location, webSource }: MessageBubbleProps) {
  return (
    <div className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up duration-300`}>
      <div className={isUser ? 'max-w-[85%] sm:max-w-xs lg:max-w-md' : 'w-full max-w-full sm:max-w-2xl'}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-base ${
            isUser
              ? 'rounded-br-xs bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/10'
              : 'rounded-bl-xs bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-850 text-slate-900 dark:text-slate-100 shadow-xs'
          }`}
        >
          <div className="max-w-full overflow-x-auto break-words prose prose-slate dark:prose-invert [&_a]:break-all [&_a]:text-rose-600 dark:[&_a]:text-rose-400 [&_a]:font-semibold [&_a]:underline [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          {timestamp && (
            <p className={`mt-2 text-[10px] font-semibold text-right ${isUser ? 'text-blue-100/70' : 'text-slate-400 dark:text-slate-500'}`}>
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
