'use client';

import { Calendar, Clock, MapPin } from 'lucide-react';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category?: string;
}

export function EventCard({ title, date, time, location, description, category }: EventCardProps) {
  const categoryColors: Record<string, string> = {
    careers: 'bg-purple-50 text-purple-650 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/30',
    academic: 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30',
    social: 'bg-rose-50 text-rose-655 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/30',
    sports: 'bg-orange-50 text-orange-650 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/30',
  };

  const categoryColor = category
    ? categoryColors[category] || 'bg-blue-50 text-blue-650 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/30'
    : 'bg-blue-50 text-blue-650 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/30';

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xs transition-all duration-350 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/30 dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none dark:hover:bg-slate-900/60">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {category && (
            <span className={`ml-2.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${categoryColor}`}>
              {category}
            </span>
          )}
        </div>
        
        <div className="mb-4 space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-purple-500 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all duration-200 hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.98]">
        Register Now
      </button>
    </div>
  );
}
