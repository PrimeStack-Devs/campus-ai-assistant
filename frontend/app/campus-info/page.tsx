'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { facilities, clubs, academicInfo, contacts } from '@/lib/mockData';

export default function CampusInfoPage() {
  return (
    <DashboardLayout title="Campus Information">
      <div className="p-8 space-y-8">
        {/* University Overview */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Parul University
          </h1>

          <p className="text-gray-600 leading-relaxed mb-4">
            Parul University is a NAAC A++ accredited private university located in
            Vadodara, Gujarat. The university offers a wide range of undergraduate,
            postgraduate, and doctoral programs across engineering, medicine,
            management, pharmacy, law, design, and many other disciplines.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-gray-900">75,000+</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-gray-900">2,500+</p>
              <p className="text-sm text-gray-600">Faculty</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-gray-900">150+</p>
              <p className="text-sm text-gray-600">Programs</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-gray-900">70+</p>
              <p className="text-sm text-gray-600">Countries Students</p>
            </div>
          </div>
        </div>
        {/* Facilities Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Facilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <InfoCard
                key={facility.id}
                title={facility.name}
                description={`Hours: ${facility.hours}`}
                details={[`📍 ${facility.location}`, ...facility.amenities.map((a) => `✓ ${a}`)]}
              />
            ))}
          </div>
        </div>

        {/* Clubs Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Clubs & Organizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <InfoCard
                key={club.id}
                title={club.name}
                description={club.description}
                badge={`${club.members} members`}
                details={[`Meets: ${club.meets}`]}
              />
            ))}
          </div>
        </div>

        {/* Academic Resources Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Academic Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicInfo.map((info, i) => (
              <InfoCard key={i} title={info.title} description={info.description} />
            ))}
          </div>
        </div>

        {/* Quick Contacts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contacts.map((contact, i) => (
              <InfoCard
                key={i}
                title={contact.name}
                description={contact.phone}
                details={[`Email: ${contact.email}`]}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
