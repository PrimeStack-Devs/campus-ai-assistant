'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { facilities, clubs, academicInfo, contacts } from '@/lib/mockData';

export default function CampusInfoPage() {
  return (
    <DashboardLayout title="Campus Information">
      <div className="space-y-8 p-8">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Facilities</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <InfoCard
                key={facility.id}
                title={facility.name}
                description={`Hours: ${facility.hours}`}
                details={[`Location: ${facility.location}`, ...facility.amenities.map((a) => `Amenity: ${a}`)]}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Clubs & Organizations</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Academic Resources</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {academicInfo.map((info, i) => (
              <InfoCard key={i} title={info.title} description={info.description} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Important Contacts</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
