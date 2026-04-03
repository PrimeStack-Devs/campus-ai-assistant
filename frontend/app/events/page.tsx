'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventCard } from '@/components/EventCard';
import { events } from '@/lib/mockData';

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['careers', 'academic', 'social', 'sports'];

  const filteredEvents = selectedCategory
    ? events.filter((e) => e.category === selectedCategory)
    : events;

  return (
    <DashboardLayout title="Campus Events">
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-2 font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              time={event.time}
              location={event.location}
              description={event.description}
              category={event.category}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-slate-500 dark:text-slate-400">No events found in this category.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
