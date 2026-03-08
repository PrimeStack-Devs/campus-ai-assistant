'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';

export default function HomePage() {
  return (
    <DashboardLayout title="Welcome to Campus AI">
      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-3">Your Personal Campus Guide</h1>
          <p className="text-lg text-blue-100 mb-6">
            Discover events, facilities, clubs, and everything you need to know about campus life.
          </p>
          <Link
            href="/chat"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Start Chatting →
          </Link>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What's New?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard
              icon="📅"
              title="Upcoming Events"
              description="Spring Career Fair, AI Workshop, and more!"
              badge="4 Events"
            />
            <InfoCard
              icon="🏛️"
              title="Campus Facilities"
              description="Libraries, dining halls, gym, and health center"
              badge="Open Now"
            />
            <InfoCard
              icon="👥"
              title="Join a Club"
              description="100+ clubs across different interests"
              badge="100+ Clubs"
            />
          </div>
        </div>

        {/* Example Questions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Try Asking...</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">What events are happening this semester?</p>
              <p className="text-sm text-gray-600 mt-1">Discover upcoming career fairs, workshops, and social events</p>
            </button>
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">Where can I study with my friends?</p>
              <p className="text-sm text-gray-600 mt-1">Get recommendations for study spaces and facilities</p>
            </button>
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">How do I join a club?</p>
              <p className="text-sm text-gray-600 mt-1">Learn about student organizations and clubs</p>
            </button>
          </div>
        </div>

        {/* Navigation Tiles */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore More</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/chat"
              className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">💬</div>
              <div className="font-semibold text-gray-900 text-sm">Chat</div>
            </Link>
            <Link
              href="/campus-info"
              className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">📍</div>
              <div className="font-semibold text-gray-900 text-sm">Campus Info</div>
            </Link>
            <Link
              href="/events"
              className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold text-gray-900 text-sm">Events</div>
            </Link>
            <Link
              href="/about"
              className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">ℹ️</div>
              <div className="font-semibold text-gray-900 text-sm">About</div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
