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
    careers: 'bg-purple-100 text-purple-700',
    academic: 'bg-green-100 text-green-700',
    social: 'bg-pink-100 text-pink-700',
    sports: 'bg-orange-100 text-orange-700',
  };

  const categoryColor = category ? categoryColors[category] || 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
        {category && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${categoryColor}`}>
            {category}
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <span>{location}</span>
        </div>
      </div>
      <p className="text-gray-700 text-sm">{description}</p>
      <button className="mt-4 w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        Learn More
      </button>
    </div>
  );
}
