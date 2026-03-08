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
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          {icon && <span className="text-3xl mb-2 block">{icon}</span>}
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-3">{description}</p>
      {details && details.length > 0 && (
        <ul className="space-y-2 text-sm text-gray-700">
          {details.map((detail, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
