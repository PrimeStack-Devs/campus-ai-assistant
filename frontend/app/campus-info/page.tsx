'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { facilities, clubs, academicInfo, contacts } from '@/lib/mockData';

export default function CampusInfoPage() {
  return (
    <DashboardLayout title="Campus Information">
      <div className="p-8 space-y-8">
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
