'use client';

import { LocationCard } from './LocationCard';
import { SourceCard } from './SourceCard';
import type { ReactNode } from 'react';
import type { LocationData, WebSourceData } from '@/lib/api';

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
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={isUser ? 'max-w-xs lg:max-w-md' : 'w-full max-w-2xl'}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'rounded-br-none bg-blue-600 text-white'
              : 'rounded-bl-none bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          <div className="space-y-1">
            {content.split('\n').map((line, index) => (
              <p key={index} className="text-md whitespace-pre-wrap leading-relaxed">
                {renderLineWithLinks(line)}
              </p>
            ))}
          </div>
          {timestamp && (
            <p className={`mt-1 text-xs ${isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
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
