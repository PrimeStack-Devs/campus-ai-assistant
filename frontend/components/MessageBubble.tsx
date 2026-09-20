'use client';

import React, { useState } from 'react';
import { LocationCard } from './LocationCard';
import { SourceCard } from './SourceCard';
import type { LocationData, WebSourceData } from '@/lib/api';
import { submitFeedback } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  location?: LocationData;
  webSource?: WebSourceData;
  userQuery?: string; // The user's original question (passed for bot messages)
}

export function MessageBubble({
  content,
  isUser,
  timestamp,
  location,
  webSource,
  userQuery,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (feedbackState || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      await submitFeedback(userQuery || '', content, isCorrect);
      setFeedbackState(isCorrect ? 'correct' : 'incorrect');
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div
      className={`group mb-6 flex ${
        isUser ? 'justify-end' : 'justify-start'
      } animate-fade-in-up duration-300`}
    >
      <div
        className={
          isUser
            ? 'max-w-[85%] sm:max-w-md flex flex-col items-end'
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

        {/* Action bar: Copy + Feedback buttons */}
        <div className="chat-action-bar flex items-center gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-all text-xs cursor-pointer"
            title="Copy message"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-[10.5px] font-medium text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span className="text-[10.5px] font-medium">Copy</span>
              </>
            )}
          </button>

          {/* Feedback buttons — only on bot messages */}
          {!isUser && (
            <>
              {feedbackLoading ? (
                <span className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" />
                </span>
              ) : feedbackState ? (
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-medium ${
                    feedbackState === 'correct'
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                >
                  {feedbackState === 'correct' ? (
                    <>
                      <ThumbsUp size={12} />
                      <span>Added to knowledge base</span>
                    </>
                  ) : (
                    <>
                      <ThumbsDown size={12} />
                      <span>Feedback recorded</span>
                    </>
                  )}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleFeedback(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:bg-emerald-100 dark:active:bg-emerald-900/30 transition-all text-xs cursor-pointer"
                    title="Good response — add to knowledge base"
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(false)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 active:bg-amber-100 dark:active:bg-amber-900/30 transition-all text-xs cursor-pointer"
                    title="Bad response"
                  >
                    <ThumbsDown size={12} />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {!isUser && location?.name && <LocationCard location={location} />}
        {!isUser && webSource?.sourceUrl && <SourceCard source={webSource} />}
      </div>
    </div>
  );
}
