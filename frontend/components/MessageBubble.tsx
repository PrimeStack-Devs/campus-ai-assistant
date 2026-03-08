'use client';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export function MessageBubble({ content, isUser, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
