'use client';

import type { WebSourceData } from '@/lib/api';

interface SourceCardProps {
  source: WebSourceData;
}

function formatScrapedAt(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SourceCard({ source }: SourceCardProps) {
  const scrapedAtLabel = formatScrapedAt(source.scrapedAt);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source</p>
      <h4 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{source.sourceLabel}</h4>
      <a
        href={source.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all text-sm text-blue-700 underline underline-offset-2 hover:opacity-80 dark:text-blue-300"
      >
        {source.sourceUrl}
      </a>
      {scrapedAtLabel && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Retrieved: {scrapedAtLabel}
          {source.cached ? ' | Cached' : ''}
        </p>
      )}
      {!scrapedAtLabel && source.cached !== undefined && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{source.cached ? 'Cached source' : 'Live source'}</p>
      )}
      {source.disclosure && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{source.disclosure}</p>}
    </div>
  );
}
