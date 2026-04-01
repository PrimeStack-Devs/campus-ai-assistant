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
  console.log('Rendering MessageBubble with content:', content);
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={isUser ? 'max-w-xs lg:max-w-md' : 'w-full max-w-2xl'}>
        <div
          className={`px-4 py-3 rounded-2xl ${isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-900 rounded-bl-none'
            }`}
        >
          <div className="space-y-1">
            {content.split('\n').map((line, index) => (
              <p key={index} className="text-md leading-relaxed whitespace-pre-wrap">
                {renderLineWithLinks(line)}
              </p>
            ))}
          </div>
          {timestamp && (
            <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
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
