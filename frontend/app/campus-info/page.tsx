'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoCard } from '@/components/InfoCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, MapPin, Users, BookOpen, PhoneCall, Loader2, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CampusInfoPage() {
  const { user, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('facilities');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCampusData = async () => {
      setIsLoading(true);
      try {
        const [facRes, deptRes, staffRes, srvRes] = await Promise.all([
          fetch(`${backendUrl}/api/campus/facilities`),
          fetch(`${backendUrl}/api/campus/departments`),
          fetch(`${backendUrl}/api/campus/faculty`),
          fetch(`${backendUrl}/api/campus/services`),
        ]);

        const [facJson, deptJson, staffJson, srvJson] = await Promise.all([
          facRes.json(),
          deptRes.json(),
          staffRes.json(),
          srvRes.json(),
        ]);

        if (facJson.success) setFacilities(facJson.data || []);
        if (deptJson.success) setDepartments(deptJson.data || []);
        if (staffJson.success) setFaculty(staffJson.data || []);
        if (srvJson.success) setServices(srvJson.data || []);
      } catch (err) {
        console.error('Failed to load campus directory data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampusData();
  }, [backendUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
  };

  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filteredFacilities = facilities.filter(
    (f) =>
      (f.name && f.name.toLowerCase().includes(normalizedSearch)) ||
      (f.category && f.category.toLowerCase().includes(normalizedSearch)) ||
      (f.building_name && f.building_name.toLowerCase().includes(normalizedSearch)) ||
      (f.description && f.description.toLowerCase().includes(normalizedSearch))
  );

  const filteredDepartments = departments.filter(
    (d) =>
      (d.name && d.name.toLowerCase().includes(normalizedSearch)) ||
      (d.building_name && d.building_name.toLowerCase().includes(normalizedSearch)) ||
      (d.hod?.name && d.hod.name.toLowerCase().includes(normalizedSearch)) ||
      (Array.isArray(d.programs) &&
        d.programs.some((p: string) => p.toLowerCase().includes(normalizedSearch)))
  );

  const filteredFaculty = faculty.filter(
    (f) =>
      (f.name && f.name.toLowerCase().includes(normalizedSearch)) ||
      (f.designation && f.designation.toLowerCase().includes(normalizedSearch)) ||
      (f.department_name && f.department_name.toLowerCase().includes(normalizedSearch)) ||
      (f.building_name && f.building_name.toLowerCase().includes(normalizedSearch)) ||
      (f.email && f.email.toLowerCase().includes(normalizedSearch))
  );

  const filteredServices = services.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(normalizedSearch)) ||
      (s.category && s.category.toLowerCase().includes(normalizedSearch)) ||
      (s.location && s.location.toLowerCase().includes(normalizedSearch)) ||
      (s.description && s.description.toLowerCase().includes(normalizedSearch))
  );

  return (
    <DashboardLayout title="Campus Directory">
      <div className="space-y-6 p-6 md:p-8 animate-fade-in-up duration-500 max-w-7xl mx-auto">
        {/* Header summary badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Parul University Campus Directory
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> Live Knowledge
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse official campus facilities, academic departments, faculty directory, and campus services.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tab Wrapper */}
        <Tabs defaultValue="facilities" value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="flex w-full flex-wrap h-auto gap-1 border border-slate-200/60 bg-slate-100/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/60 md:inline-flex md:w-auto rounded-2xl">
            <TabsTrigger value="facilities" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs">
              <MapPin className="h-3.5 w-3.5" />
              Facilities ({facilities.length})
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Departments ({departments.length})
            </TabsTrigger>
            <TabsTrigger value="faculty" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs">
              <Users className="h-3.5 w-3.5" />
              Faculty Directory ({faculty.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs">
              <PhoneCall className="h-3.5 w-3.5" />
              Services ({services.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-medium">Fetching real-time campus directory...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Facilities */}
              <TabsContent value="facilities" className="outline-none">
                {filteredFacilities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFacilities.map((facility, i) => (
                      <InfoCard
                        key={facility.id || i}
                        title={facility.name}
                        description={facility.description || `Category: ${facility.category || 'Facility'}`}
                        badge={facility.hours || 'Open Daily'}
                        details={[
                          `Building: ${facility.building_name || 'Campus Wide'}${facility.floor ? ` (Floor ${facility.floor})` : ''}`,
                          ...(Array.isArray(facility.amenities)
                            ? facility.amenities.map((a: string) => `Feature: ${a}`)
                            : []),
                        ]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No campus facilities match your search query.
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Departments */}
              <TabsContent value="departments" className="outline-none">
                {filteredDepartments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDepartments.map((dept, i) => (
                      <InfoCard
                        key={dept.id || i}
                        title={dept.name}
                        description={`Faculty: ${dept.parent_faculty || 'Engineering & Technology'}`}
                        badge={`Floor ${dept.floor || '1'}`}
                        details={[
                          `Building: ${dept.building_name || 'Academic Block'}`,
                          `HOD: ${dept.hod?.name || 'Department Office'}`,
                          ...(Array.isArray(dept.programs)
                            ? [`Programs: ${dept.programs.slice(0, 3).join(', ')}${dept.programs.length > 3 ? '...' : ''}`]
                            : []),
                        ]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No academic departments match your search query.
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Faculty */}
              <TabsContent value="faculty" className="outline-none">
                {!user && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>
                        Direct email addresses and cabin phone extensions are protected. Sign in with Google to view faculty contacts.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs cursor-pointer text-[11px]"
                    >
                      <span>Sign In to Unlock</span>
                    </button>
                  </div>
                )}

                {filteredFaculty.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFaculty.map((fac, i) => (
                      <InfoCard
                        key={fac.id || i}
                        title={fac.name}
                        description={fac.designation || 'Faculty Member'}
                        badge={fac.department_name || 'Academic'}
                        details={[
                          `Office: ${fac.building_name || 'Faculty Block'}${fac.room ? ` (${fac.room})` : ''}`,
                          user
                            ? fac.email
                              ? `Email: ${fac.email}`
                              : 'Contact: Via Department'
                            : 'Email: 🔒 Sign in to view',
                          ...(user && fac.phone ? [`Phone: ${fac.phone}`] : []),
                        ]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No faculty members match your search query.
                  </div>
                )}
              </TabsContent>

              {/* Tab 4: Services */}
              <TabsContent value="services" className="outline-none">
                {filteredServices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((srv, i) => (
                      <InfoCard
                        key={srv.id || i}
                        title={srv.name}
                        description={srv.description || srv.category || 'Campus Service'}
                        badge={srv.category || 'Essential Service'}
                        details={[
                          `Location: ${srv.location || 'Campus Center'}`,
                          ...(srv.timings ? [`Timings: ${srv.timings}`] : []),
                          ...(srv.contact ? [`Contact: ${srv.contact}`] : []),
                        ]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No campus services match your search query.
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
