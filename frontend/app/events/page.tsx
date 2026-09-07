'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventCard } from '@/components/EventCard';
import { Loader2, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function EventsPage() {
  const { user, loginWithGoogle } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/campus/events`);
        const json = await res.json();
        if (json.success) {
          setEvents(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load campus events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [backendUrl]);

  const categories = ['Academic', 'Exams', 'Holidays'];

  const filteredEvents = selectedCategory
    ? events.filter(
        (e) => (e.category || '').toLowerCase() === selectedCategory.toLowerCase()
      )
    : events;

  return (
    <DashboardLayout title="Academic Calendar & Events">
      <div className="space-y-8 p-6 md:p-8 animate-fade-in-up duration-500 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              University Calendar & Events
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> Live Schedules
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official Parul University semester timelines, exam periods, and gazetted holidays.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              All Events ({events.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedCategory?.toLowerCase() === cat.toLowerCase()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                {cat === 'Exams' && !user && (
                  <Lock size={12} className="opacity-70 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading university calendar events...</p>
          </div>
        ) : selectedCategory?.toLowerCase() === 'exams' && !user ? (
          <div className="py-12 px-6 max-w-lg mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs">
              <Lock size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                University Student Login Required
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Semester examination schedules, mid-term test windows, and practical assessment dates are private to enrolled students and faculty.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={loginWithGoogle}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2 text-xs"
              >
                <span>Sign In with Student Account</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event, idx) => (
              <EventCard
                key={event.id || idx}
                title={event.title}
                date={event.date}
                time={event.time || 'All Day'}
                location={event.location || 'Parul University'}
                description={event.description}
                category={event.category || 'Academic'}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg font-bold text-slate-400 dark:text-slate-500">
              No events found in this category.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
