'use client';

import { Calendar, MapPin, Users, Sparkles, GraduationCap, Phone, Info, HelpCircle } from 'lucide-react';

const iconMap: Record<string, any> = {
  Events: Calendar,
  Campus: MapPin,
  Clubs: Users,
  AI: Sparkles,
  Facilities: MapPin,
  Study: GraduationCap,
  Help: Phone,
  Info: Info,
};

interface InfoCardProps {
  icon?: string;
  title: string;
  description: string;
  details?: string[];
  badge?: string;
}

export function InfoCard({ icon, title, description, details, badge }: InfoCardProps) {
  const IconComponent = icon ? iconMap[icon] || iconMap.Info : null;

  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xs transition-all duration-350 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-800/80 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none dark:hover:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between">
        {IconComponent && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
            <IconComponent className="h-5.5 w-5.5" />
          </div>
        )}
        {badge && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-4">{description}</p>
      
      {details && details.length > 0 && (
        <ul className="space-y-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
          {details.map((detail, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span className="break-words">{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
