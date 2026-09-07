'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { Threads } from '@/components/backgrounds/Threads';
import { MessageSquare, Sparkles, ArrowRight, Compass, CalendarDays, HelpCircle, ShieldAlert, Zap, MapPin, GraduationCap } from 'lucide-react';

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
    <DashboardLayout title="Welcome to Dexa AI">
      <div className="space-y-10 p-6 md:p-8 animate-fade-in-up duration-500">

        {/* Hero Card Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 p-8 text-white border border-indigo-500/25 shadow-2xl shadow-indigo-950/50 md:p-10">
          {/* ReactBits Web Threads Background */}
          <div className="absolute inset-0 pointer-events-none opacity-85">
            <Threads
              color={[0.50, 0.46, 1.0]}
              amplitude={1.25}
              distance={0.3}
              enableMouseInteraction={true}
            />
          </div>

          {/* Ambient Glow Overlays */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 -mb-10 h-48 w-48 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left Content Column */}
            <div className="max-w-xl">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1 text-xs font-semibold tracking-wide text-indigo-200 backdrop-blur-md shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                Dexa AI • Parul University Guide
              </span>
              <h1 className="mb-4 text-3xl font-black tracking-tight md:text-5xl text-white">
                Meet <span className="bg-gradient-to-r from-indigo-300 via-sky-200 to-white bg-clip-text text-transparent">Dexa AI</span>
                <span className="block text-xl md:text-3xl font-bold text-slate-200 mt-1.5">
                  Your Personal Campus Guide
                </span>
              </h1>
              <p className="mb-8 text-base md:text-lg leading-relaxed text-slate-300 font-normal">
                Discover events, facilities, clubs, faculty contacts, and everything you need to know about campus life.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:opacity-95 active:scale-95"
              >
                Start Chatting
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right Interactive Intelligence Glass Deck */}
            <div className="hidden lg:flex flex-col gap-3 w-80 shrink-0">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl shadow-indigo-950/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Dexa AI Brain
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                    Live v2.0
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                    <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Instant Campus Answers</p>
                      <p className="text-[11px] text-slate-400">Verified university info & live campus updates</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                    <MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Campus Navigator</p>
                      <p className="text-[11px] text-slate-400">40+ buildings, GPS directions & hostels</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                    <GraduationCap size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Academic Intelligence</p>
                      <p className="text-[11px] text-slate-400">Faculty contacts, exam & backlog rules</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div>
          <h2 className="mb-5 text-xl font-black tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-500" />
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
            <MessageSquare className="h-5 w-5 text-indigo-500" />
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
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 text-left transition-all duration-300 hover:scale-[1.005] hover:border-indigo-400 hover:shadow-md hover:shadow-slate-100 dark:border-slate-800/80 dark:bg-slate-900/20 dark:hover:bg-slate-900/60 dark:hover:border-indigo-800/80 dark:hover:shadow-none"
              >
                <div className="pr-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {prompt.q}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {prompt.desc}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-500" />
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
                className="group rounded-2xl border border-slate-200/60 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:bg-slate-900/50 dark:hover:border-indigo-800/80"
              >
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
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
