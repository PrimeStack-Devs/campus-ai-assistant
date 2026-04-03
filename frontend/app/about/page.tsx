'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';

export default function AboutPage() {
  return (
    <DashboardLayout title="About Campus AI">
      <div className="max-w-5xl space-y-8 p-8">
        <div className="rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 p-8 dark:border-blue-500/20 dark:from-slate-900 dark:to-slate-800">
          <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Campus AI Assistant</h1>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Campus AI is your personal guide to everything happening at our university. Whether you&apos;re looking for
            events, facilities, clubs, or academic resources, our intelligent assistant is here to help you make the
            most of your campus experience.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Key Features</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard icon="AI" title="Smart Chat Assistant" description="Ask questions in natural language and get instant answers about campus life" />
            <InfoCard icon="Events" title="Event Discovery" description="Browse and filter upcoming events across all categories" />
            <InfoCard icon="Facilities" title="Facility Information" description="Find hours, locations, and amenities for all campus facilities" />
            <InfoCard icon="Clubs" title="Club Directory" description="Explore 100+ clubs and organizations to join" />
            <InfoCard icon="Study" title="Academic Resources" description="Access tutoring, office hours, and course registration information" />
            <InfoCard icon="Help" title="Quick Contacts" description="Reach important departments and offices quickly" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">What&apos;s Coming</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Advanced AI with Real-time Data</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Connect to university APIs for live event updates and real-time facility information.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mobile App</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Native iOS and Android apps for on-the-go campus access.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Smart Notifications</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Get notified about events and updates relevant to your interests.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Student Resources Hub</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Integrated academic planning, course recommendations, and study tools.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">Ready to explore campus?</h2>
          <p className="mb-6 text-blue-100">Start chatting with Campus AI to discover everything happening on campus.</p>
          <Link
            href="/chat"
            className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Start Chatting Now
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
