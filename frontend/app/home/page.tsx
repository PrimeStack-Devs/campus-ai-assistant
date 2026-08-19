'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { MessageSquare, Sparkles, ArrowRight, Compass, CalendarDays, HelpCircle, ShieldAlert } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const handlePromptClick = (promptText: string) => {
    // Navigate to chat and could store initial prompt
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('campus-ai-initial-prompt', promptText);
    }
    router.push('/chat');
  };

  return (
    <DashboardLayout title="Welcome to Campus AI">
      <div className="space-y-10 p-6 md:p-8 animate-fade-in-up duration-500">
        
        {/* Hero Card Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-500 to-amber-500 p-8 text-white shadow-xl shadow-rose-500/10 dark:shadow-none dark:border dark:border-white/10 md:p-10">
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -mb-20 h-60 w-60 rounded-full bg-rose-500/10 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-250" />
              Powered by LangGraph & Groq
            </span>
            <h1 className="mb-4 text-3xl font-black tracking-tight md:text-5xl">
              Your Personal Campus Guide
            </h1>
            <p className="mb-8 text-base md:text-lg leading-relaxed text-rose-50/90 font-medium">
              Discover events, facilities, clubs, and everything you need to know about campus life.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-rose-600 shadow-md transition-all duration-200 hover:bg-rose-50 hover:shadow-lg active:scale-95"
            >
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Info Grid */}
        <div>
          <h2 className="mb-5 text-xl font-black tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Compass className="h-5 w-5 text-rose-500" />
            What&apos;s New?
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon="Events" title="Upcoming Events" description="Spring Career Fair, AI Workshop, and more!" badge="4 Events" />
            <InfoCard icon="Campus" title="Campus Facilities" description="Libraries, dining halls, gym, and health center" badge="Open Now" />
            <InfoCard icon="Clubs" title="Join a Club" description="100+ clubs across different interests" badge="100+ Clubs" />
          </div>
        </div>

        {/* Try Asking Section */}
        <div>
          <h2 className="mb-5 text-xl font-black tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-rose-500" />
            Try Asking Dexa...
          </h2>
          <div className="space-y-3.5">
            {[
              {
                q: "What events are happening this semester?",
                desc: "Discover upcoming career fairs, workshops, and social events"
              },
              {
                q: "Where can I study with my friends?",
                desc: "Get recommendations for study spaces and facilities"
              },
              {
                q: "How do I join a club?",
                desc: "Learn about student organizations and clubs"
              }
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt.q)}
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 text-left transition-all duration-300 hover:scale-[1.005] hover:border-rose-400 hover:shadow-md hover:shadow-slate-100 dark:border-slate-800/80 dark:bg-slate-900/20 dark:hover:bg-slate-900/60 dark:hover:shadow-none"
              >
                <div className="pr-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {prompt.q}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {prompt.desc}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-rose-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Explore More Row */}
        <div>
          <h2 className="mb-5 text-xl font-black tracking-tight text-slate-800 dark:text-slate-200">
            Explore More
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { href: "/chat", label: "Chat Assistant" },
              { href: "/campus-info", label: "Campus Directory" },
              { href: "/events", label: "Event Calendars" },
              { href: "/about", label: "About App" }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="group rounded-2xl border border-slate-200/60 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:bg-slate-900/50"
              >
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Section */}
        <div className="border-t border-slate-200/50 pt-8 dark:border-slate-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-200/40 p-6 dark:bg-slate-900/10 dark:border-slate-800/40">
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">Administrator Access</p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Manage events, locations, documents, and view metrics</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Admin Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
