'use client';

import { LocationCard } from './LocationCard';

interface LocationData {
  name: string;
  building?: string;
  floor?: string;
  latitude: number;
  longitude: number;
}

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  location?: LocationData;
}

export function MessageBubble({ content, isUser, timestamp, location }: MessageBubbleProps) {
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

          <p className="text-md leading-relaxed"> {content.split('\n').map((line, index) => (
            <p key={index} className="text-md leading-relaxed">
              {line}
            </p>
          ))}</p>
          {timestamp && (
            <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {timestamp}
            </p>
          )}
        </div>
        {!isUser && location?.name && <LocationCard location={location} />}
      </div>
    </div>
  );
}
