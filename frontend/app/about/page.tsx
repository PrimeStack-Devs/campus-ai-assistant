'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';

export default function AboutPage() {
  return (
    <DashboardLayout title="About Campus AI">
      <div className="p-8 space-y-8 max-w-4xl">
        {/* Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Campus AI Assistant</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Campus AI is your personal guide to everything happening at our university. Whether you're looking for
            events, facilities, clubs, or academic resources, our intelligent assistant is here to help you make the
            most of your campus experience.
          </p>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon="🤖"
              title="Smart Chat Assistant"
              description="Ask questions in natural language and get instant answers about campus life"
            />
            <InfoCard
              icon="📅"
              title="Event Discovery"
              description="Browse and filter upcoming events across all categories"
            />
            <InfoCard
              icon="🏛️"
              title="Facility Information"
              description="Find hours, locations, and amenities for all campus facilities"
            />
            <InfoCard
              icon="👥"
              title="Club Directory"
              description="Explore 100+ clubs and organizations to join"
            />
            <InfoCard
              icon="📚"
              title="Academic Resources"
              description="Access tutoring, office hours, and course registration information"
            />
            <InfoCard
              icon="📞"
              title="Quick Contacts"
              description="Reach important departments and offices quickly"
            />
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built With</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">⚛️</div>
                <div className="text-sm font-semibold text-gray-900">React 19</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-sm font-semibold text-gray-900">Next.js 16</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm font-semibold text-gray-900">Tailwind CSS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🧠</div>
                <div className="text-sm font-semibold text-gray-900">AI SDK</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm font-semibold text-gray-900">TypeScript</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-sm font-semibold text-gray-900">shadcn/ui</div>
              </div>
            </div>
          </div>
        </div>

        {/* Future Roadmap */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Coming</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="font-semibold text-gray-900">Advanced AI with Real-time Data</h3>
                <p className="text-sm text-gray-600">Connect to university APIs for live event updates and real-time facility information</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <span className="text-xl">📱</span>
              <div>
                <h3 className="font-semibold text-gray-900">Mobile App</h3>
                <p className="text-sm text-gray-600">Native iOS and Android apps for on-the-go campus access</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <span className="text-xl">🔔</span>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Notifications</h3>
                <p className="text-sm text-gray-600">Get notified about events and updates relevant to your interests</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <span className="text-xl">🎓</span>
              <div>
                <h3 className="font-semibold text-gray-900">Student Resources Hub</h3>
                <p className="text-sm text-gray-600">Integrated academic planning, course recommendations, and study tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to explore campus?</h2>
          <p className="mb-6 text-blue-100">Start chatting with Campus AI to discover everything happening on campus</p>
          <a
            href="/chat"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Start Chatting Now
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
