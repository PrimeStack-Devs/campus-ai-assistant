'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { Mail, Linkedin, ExternalLink, Code2, Smartphone, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <DashboardLayout title="About Kryvix AI">
      <div className="max-w-5xl space-y-8 p-8">
        <div className="rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 p-8 dark:border-blue-500/20 dark:from-slate-900 dark:to-slate-800">
          <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Kryvix AI Assistant</h1>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Kryvix AI is your personal guide to everything happening at Parul University. Whether you&apos;re looking for
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
            {/* <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mobile App</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Native iOS and Android apps for on-the-go campus access.</p>
            </div> */}
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

        {/* Meet the Builders Section */}
        {/* Commented for now */}
        {/* <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-linear-to-tr from-indigo-500 to-violet-500 text-white shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Meet the Builders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The engineering team behind Kryvix&apos;s campus intelligence platform
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-base font-bold text-white shadow-md shadow-indigo-500/20">
                  DD
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Deepak Dhakad
                    <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Code2 size={11} className="mr-1 inline" />
                      Lead
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Lead Full-Stack AI Engineer
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Architected and engineered the end-to-end web platform, Node.js backend, LangGraph multi-agent RAG workflow, vector search, Redis caching, and real-time campus data intelligence.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <a
                  href="mailto:deepakdkd1188@gmail.com"
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200/60 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                >
                  <Mail size={13} />
                  <span>deepakdkd1188@gmail.com</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/deepak-dhakad-web-developer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200/60 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                >
                  <Linkedin size={13} />
                  <span>LinkedIn</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>


            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-sky-500 text-base font-bold text-white shadow-md shadow-indigo-500/20">
                  JP
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Jatin Puri
                    <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Smartphone size={11} className="mr-1 inline" />
                      Mobile
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Mobile App Developer
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Engineered the native campus mobile application, delivering responsive campus navigation, timetable access, and real-time AI assistance directly into students&apos; hands.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <a
                  href="mailto:purijatinn@gmail.com"
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200/60 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                >
                  <Mail size={13} />
                  <span>purijatinn@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div> */}

        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">Ready to explore campus?</h2>
          <p className="mb-6 text-blue-100">Start chatting with Kryvix AI to discover everything happening on campus.</p>
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
