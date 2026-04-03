'use client';

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
    careers: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    academic: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    social: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
    sports: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  };

  const categoryColor = category
    ? categoryColors[category] || 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">{title}</h3>
        {category && (
          <span className={`ml-2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${categoryColor}`}>
            {category}
          </span>
        )}
      </div>
      <div className="mb-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-lg">Date</span>
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">Time</span>
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">Place</span>
          <span>{location}</span>
        </div>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-200">{description}</p>
      <button className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        Learn More
      </button>
    </div>
  );
}
