'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { facilities, clubs, academicInfo, contacts } from '@/lib/mockData';
import { Search, MapPin, Users, BookOpen, PhoneCall } from 'lucide-react';

export default function CampusInfoPage() {
  const [activeTab, setActiveTab] = useState('facilities');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery(''); // reset search on tab switch
  };

  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(normalizedSearch) ||
      f.location.toLowerCase().includes(normalizedSearch) ||
      f.amenities.some((a) => a.toLowerCase().includes(normalizedSearch))
  );

  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedSearch) ||
      c.description.toLowerCase().includes(normalizedSearch) ||
      c.meets.toLowerCase().includes(normalizedSearch)
  );

  const filteredAcademics = academicInfo.filter(
    (a) =>
      a.title.toLowerCase().includes(normalizedSearch) ||
      a.description.toLowerCase().includes(normalizedSearch)
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedSearch) ||
      c.phone.toLowerCase().includes(normalizedSearch) ||
      c.email.toLowerCase().includes(normalizedSearch)
  );

  return (
    <DashboardLayout title="Campus Directory">
      <div className="space-y-6 p-6 md:p-8 animate-fade-in-up duration-500">
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-3 focus:ring-rose-500/10 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100"
          />
        </div>

        {/* Tab Wrapper */}
        <Tabs defaultValue="facilities" value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="flex w-full flex-wrap h-auto gap-1 border border-slate-200/50 bg-slate-50 p-1.5 dark:border-slate-850 dark:bg-slate-900/50 md:inline-flex md:w-auto rounded-2xl">
            <TabsTrigger value="facilities" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold">
              <MapPin className="h-4 w-4" />
              Facilities
            </TabsTrigger>
            <TabsTrigger value="clubs" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold">
              <Users className="h-4 w-4" />
              Clubs & Groups
            </TabsTrigger>
            <TabsTrigger value="academics" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold">
              <BookOpen className="h-4 w-4" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold">
              <PhoneCall className="h-4 w-4" />
              Important Contacts
            </TabsTrigger>
          </TabsList>

          {/* Facilities Content */}
          <TabsContent value="facilities" className="outline-none">
            {filteredFacilities.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFacilities.map((facility) => (
                  <InfoCard
                    key={facility.id}
                    title={facility.name}
                    description={`Hours: ${facility.hours}`}
                    badge="Open Now"
                    details={[`Location: ${facility.location}`, ...facility.amenities.map((a) => `Amenity: ${a}`)]}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-550 dark:text-slate-400">
                No facilities match your search.
              </div>
            )}
          </TabsContent>

          {/* Clubs Content */}
          <TabsContent value="clubs" className="outline-none">
            {filteredClubs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => (
                  <InfoCard
                    key={club.id}
                    title={club.name}
                    description={club.description}
                    badge={`${club.members} members`}
                    details={[`Meets: ${club.meets}`]}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-550 dark:text-slate-400">
                No student clubs match your search.
              </div>
            )}
          </TabsContent>

          {/* Academics Content */}
          <TabsContent value="academics" className="outline-none">
            {filteredAcademics.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredAcademics.map((info, i) => (
                  <InfoCard key={i} title={info.title} description={info.description} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-550 dark:text-slate-400">
                No academic resources match your search.
              </div>
            )}
          </TabsContent>

          {/* Contacts Content */}
          <TabsContent value="contacts" className="outline-none">
            {filteredContacts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredContacts.map((contact, i) => (
                  <InfoCard
                    key={i}
                    title={contact.name}
                    description={contact.phone}
                    badge="Direct Line"
                    details={[`Email: ${contact.email}`]}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-550 dark:text-slate-400">
                No contacts match your search.
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
}
