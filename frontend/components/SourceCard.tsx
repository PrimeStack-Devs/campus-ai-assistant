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
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source</p>
      <h4 className="mt-1 font-semibold text-gray-900">{source.sourceLabel}</h4>
      <a
        href={source.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all text-sm text-blue-700 underline underline-offset-2 hover:opacity-80"
      >
        {source.sourceUrl}
      </a>
      {scrapedAtLabel && (
        <p className="mt-2 text-xs text-gray-500">
          Retrieved: {scrapedAtLabel}
          {source.cached ? ' | Cached' : ''}
        </p>
      )}
      {!scrapedAtLabel && source.cached !== undefined && (
        <p className="mt-2 text-xs text-gray-500">{source.cached ? 'Cached source' : 'Live source'}</p>
      )}
      {source.disclosure && <p className="mt-2 text-sm text-gray-600">{source.disclosure}</p>}
    </div>
  );
}
