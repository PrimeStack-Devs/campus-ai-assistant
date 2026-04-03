'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';

export default function HomePage() {
  return (
    <DashboardLayout title="Welcome to Campus AI">
      <div className="space-y-8 p-8">
        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white shadow-xl shadow-blue-900/10 dark:shadow-black/20">
          <h1 className="mb-3 text-4xl font-bold">Your Personal Campus Guide</h1>
          <p className="mb-6 text-lg text-blue-100">
            Discover events, facilities, clubs, and everything you need to know about campus life.
          </p>
          <Link
            href="/chat"
            className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Start Chatting
          </Link>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">What&apos;s New?</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon="Events" title="Upcoming Events" description="Spring Career Fair, AI Workshop, and more!" badge="4 Events" />
            <InfoCard icon="Campus" title="Campus Facilities" description="Libraries, dining halls, gym, and health center" badge="Open Now" />
            <InfoCard icon="Clubs" title="Join a Club" description="100+ clubs across different interests" badge="100+ Clubs" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Try Asking...</h2>
          <div className="space-y-3">
            <button className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">What events are happening this semester?</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Discover upcoming career fairs, workshops, and social events</p>
            </button>
            <button className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Where can I study with my friends?</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Get recommendations for study spaces and facilities</p>
            </button>
            <button className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">How do I join a club?</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Learn about student organizations and clubs</p>
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Explore More</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link href="/chat" className="rounded-lg border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chat</div>
            </Link>
            <Link href="/campus-info" className="rounded-lg border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Campus Info</div>
            </Link>
            <Link href="/events" className="rounded-lg border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Events</div>
            </Link>
            <Link href="/about" className="rounded-lg border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">About</div>
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Administrator Access</p>
          <Link
            href="/admin"
            className="inline-block rounded-lg bg-slate-900 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
