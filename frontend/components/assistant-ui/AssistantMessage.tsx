'use client';

import React, { useState } from 'react';
import { MessagePrimitive, ActionBarPrimitive, useAuiState } from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Copy, Check, RotateCw } from 'lucide-react';
import { LocationCard } from '@/components/LocationCard';
import { SourceCard } from '@/components/SourceCard';
import type { LocationData, WebSourceData } from '@/lib/api';

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-700/70 bg-slate-950 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-mono uppercase tracking-wider text-[10px] text-slate-400">
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 text-[10.5px]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10.5px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs text-slate-100 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderCellContent(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    if (/<br\s*\/?>/i.test(children)) {
      const parts = children.split(/<br\s*\/?>/gi);
      return parts.map((part, index) => (
        <span key={index}>
          {index > 0 && <br />}
          {part}
        </span>
      ));
    }
    return children;
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <React.Fragment key={index}>{renderCellContent(child)}</React.Fragment>
    ));
  }

  return children;
}

function preprocessMarkdown(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let text = content.replace(/\r\n/g, '\n');

  // 1. Separate table rows that were collapsed into a single line with `| |`
  text = text.replace(/(\|[^\n]+\|)/g, (match) => {
    if (match.includes('|-') && /\|\s*\|/.test(match)) {
      let fixed = match.replace(/\|[ \t]*\|(?=[ \t]*[-:]{2,}[ \t]*\|)/g, '|\n|');
      fixed = fixed.replace(/\|[ \t]*\|(?=[ \t]*[^|\n]+[ \t]*\|)/g, '|\n|');
      return fixed;
    }
    if (/\|\s*\|\s*[^|\n]+\|/.test(match) && match.split('|').length > 8) {
      return match.replace(/\|[ \t]*\|(?=[ \t]*[^|\n]+[ \t]*\|)/g, '|\n|');
    }
    return match;
  });

  // 2. Ensure an empty line BEFORE any table block if preceded by non-table text
  text = text.replace(/([^\n|])\n(\|[^\n]+\|)/g, '$1\n\n$2');

  // 3. Ensure an empty line AFTER any table block if followed by non-table text
  text = text.replace(/(\|[^\n]+\|)\n([^\n|])/g, '$1\n\n$2');

  return text;
}

export function AssistantMessage() {
  const customMetadata = useAuiState((s) => (s.message?.metadata as any)?.custom);
  const location = customMetadata?.location as LocationData | undefined;
  const webSource = customMetadata?.webSource as WebSourceData | undefined;

  const hasContent = useAuiState((s) => {
    const parts = s.message?.parts || [];
    if (parts.length === 0) return false;
    return parts.some((p: any) => {
      if (p.type === 'text') return (p.text || '').trim().length > 0;
      return true;
    });
  });

  return (
    <MessagePrimitive.Root className="group mb-5 sm:mb-6 flex items-start gap-2.5 sm:gap-3.5 animate-fade-in-up duration-250 max-w-3xl">
      {/* AI Avatar */}
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20 mt-0.5">
        <Sparkles size={14} className="sm:w-4 sm:h-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {/* Message Content Container */}
        <div
          className={`rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 shadow-xs leading-relaxed overflow-hidden ${
            !hasContent ? 'w-fit' : ''
          }`}
        >
          {!hasContent ? (
            <div className="flex items-center gap-2.5 py-0.5 px-0.5 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 tracking-wide animate-pulse">
                Dexa is thinking...
              </span>
            </div>
          ) : (
            <MessagePrimitive.Content
              components={{
                Text: () => (
                  <MarkdownTextPrimitive
                    remarkPlugins={[remarkGfm]}
                    preprocess={preprocessMarkdown}
                    components={{
                      pre: ({ children }) => <>{children}</>,
                      code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const isMultiLine = codeString.includes('\n');
                        const isCodeBlock = Boolean(match) || isMultiLine;

                        if (isCodeBlock) {
                          return <CodeBlock code={codeString} language={match?.[1]} />;
                        }

                        return (
                          <code
                            {...props}
                            className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60"
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ node, ...props }) => (
                        <p
                          {...props}
                          className="text-slate-800 dark:text-slate-100 leading-relaxed mb-2.5 last:mb-0 font-normal"
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-2" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-2.5 mb-1" />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong {...props} className="font-bold text-slate-900 dark:text-white" />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-500"
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-100" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-100" />
                      ),
                      li: ({ node, ...props }) => <li {...props} className="leading-relaxed" />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          {...props}
                          className="border-l-2 border-indigo-500 pl-3 my-2 italic text-slate-600 dark:text-slate-300"
                        />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr {...props} className="my-3.5 border-slate-200 dark:border-slate-800" />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
                          <table {...props} className="w-full text-left text-xs sm:text-sm border-collapse min-w-full" />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead
                          {...props}
                          className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/70 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider text-[11px]"
                        />
                      ),
                      tbody: ({ node, ...props }) => (
                        <tbody {...props} className="divide-y divide-slate-100 dark:divide-slate-800/60" />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr {...props} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" />
                      ),
                      th: ({ node, children, ...props }) => (
                        <th
                          {...props}
                          className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap bg-slate-100/70 dark:bg-slate-800/50 border-r border-slate-200/60 dark:border-slate-700/40 last:border-r-0"
                        >
                          {renderCellContent(children)}
                        </th>
                      ),
                      td: ({ node, children, ...props }) => (
                        <td
                          {...props}
                          className="px-3.5 py-2 text-slate-700 dark:text-slate-300 leading-normal align-top border-r border-slate-100/80 dark:border-slate-800/40 last:border-r-0"
                        >
                          {renderCellContent(children)}
                        </td>
                      ),
                    }}
                  />
                ),
              }}
            />
          )}

          {/* Location Card Widget */}
          {location && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <LocationCard location={location} />
            </div>
          )}

          {/* Web Source Citation Widget */}
          {webSource && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <SourceCard source={webSource} />
            </div>
          )}
        </div>

        {/* Action Toolbar on Hover (only when message has content) */}
        {hasContent && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
            <ActionBarPrimitive.Root className="flex items-center gap-1">
              <ActionBarPrimitive.Copy
                copiedDuration={2000}
                className="group/btn flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer"
                title="Copy message"
              >
                <Copy size={12} className="group-data-[copied=true]/btn:hidden" />
                <Check size={12} className="hidden group-data-[copied=true]/btn:inline text-emerald-500" />
                <span className="text-[10.5px] font-medium group-data-[copied=true]/btn:text-emerald-500">
                  Copy
                </span>
              </ActionBarPrimitive.Copy>

              <ActionBarPrimitive.Reload
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer"
                title="Regenerate answer"
              >
                <RotateCw size={12} />
                <span className="text-[10.5px] font-medium">Retry</span>
              </ActionBarPrimitive.Reload>
            </ActionBarPrimitive.Root>
          </div>
        )}
      </div>
    </MessagePrimitive.Root>
  );
}
