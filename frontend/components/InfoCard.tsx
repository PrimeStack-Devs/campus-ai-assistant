'use client';

interface InfoCardProps {
  icon?: string;
  title: string;
  description: string;
  details?: string[];
  badge?: string;
}

export function InfoCard({ icon, title, description, details, badge }: InfoCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
      <div className="mb-3 flex items-start justify-between">
        <div>
          {icon && <span className="mb-2 block text-3xl">{icon}</span>}
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            {badge}
          </span>
        )}
      </div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      {details && details.length > 0 && (
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {details.map((detail, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 text-blue-600 dark:text-blue-400">*</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
