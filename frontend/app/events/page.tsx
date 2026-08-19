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
      <div className="space-y-8 p-6 md:p-8 animate-fade-in-up duration-500">
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/15'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
            }`}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold capitalize transition-all duration-200 active:scale-95 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/15'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="py-16 text-center">
            <p className="text-lg font-bold text-slate-400 dark:text-slate-500">No events found in this category.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
