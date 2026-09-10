'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  GraduationCap,
  Clock,
  Building2,
  Award,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  RotateCcw,
  BadgeCheck,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export interface FacultyMember {
  id: string;
  name: string;
  role?: string;
  category?: string;
  designation?: string;
  department_name?: string;
  department_id?: string | null;
  building_name?: string | null;
  floor?: number | null;
  room?: string | null;
  qualification?: string;
  experience_months?: number;
  gender?: string;
  association_type?: string;
  currently_working?: boolean;
  joining_date?: string;
  leaving_date?: string | null;
  email?: string;
  phone?: string;
  landline_ext?: string;
  assigned_divisions?: string;
  subjects_taught?: string[];
  aliases?: string[];
  description?: string;
}

interface FacultyDirectoryProps {
  faculty: FacultyMember[];
  user?: any;
  loginWithGoogle?: () => void;
  isLoading?: boolean;
  externalSearch?: string;
}

export function FacultyDirectory({
  faculty,
  user,
  loginWithGoogle,
  isLoading = false,
  externalSearch = '',
}: FacultyDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState(externalSearch);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [sortOption, setSortOption] = useState('exp_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [activeModalFaculty, setActiveModalFaculty] = useState<FacultyMember | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external search if changed from parent
  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearchQuery(externalSearch);
      setCurrentPage(1);
    }
  }, [externalSearch]);

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedDegree('all');
    setSelectedDesignation('all');
    setSortOption('exp_desc');
    setCurrentPage(1);
  };

  // Compute distinct departments with counts
  const departmentStats = useMemo(() => {
    const map = new Map<string, number>();
    faculty.forEach((f) => {
      const dept = f.department_name?.trim() || 'General Academic';
      map.set(dept, (map.get(dept) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [faculty]);

  // Compute university-wide KPI summary stats
  const kpiStats = useMemo(() => {
    let totalPhd = 0;
    let totalExpMonths = 0;
    let expCount = 0;
    const deptsSet = new Set<string>();

    faculty.forEach((f) => {
      if (f.department_name) deptsSet.add(f.department_name);
      if (
        f.qualification &&
        (f.qualification.toLowerCase().includes('ph.d') ||
          f.qualification.toLowerCase().includes('phd') ||
          f.qualification.toLowerCase().includes('doctor'))
      ) {
        totalPhd++;
      }
      if (typeof f.experience_months === 'number' && f.experience_months > 0) {
        totalExpMonths += f.experience_months;
        expCount++;
      }
    });

    const avgExpYrs = expCount > 0 ? (totalExpMonths / (expCount * 12)).toFixed(1) : '0';

    return {
      total: faculty.length,
      phdCount: totalPhd,
      avgExpYears: avgExpYrs,
      departmentsCount: deptsSet.size,
    };
  }, [faculty]);

  // Filter and sort the faculty roster
  const filteredFaculty = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return faculty
      .filter((f) => {
        // Search query filter
        if (q) {
          const matchName = f.name?.toLowerCase().includes(q);
          const matchDesignation = f.designation?.toLowerCase().includes(q);
          const matchCategory = f.category?.toLowerCase().includes(q);
          const matchDivisions = f.assigned_divisions?.toLowerCase().includes(q);
          const matchDept = f.department_name?.toLowerCase().includes(q);
          const matchQual = f.qualification?.toLowerCase().includes(q);
          const matchEmail = f.email?.toLowerCase().includes(q);
          const matchPhone = f.phone?.toLowerCase().includes(q);
          const matchBuilding = f.building_name?.toLowerCase().includes(q);
          const matchSubjects =
            Array.isArray(f.subjects_taught) &&
            f.subjects_taught.some((s) => s.toLowerCase().includes(q));
          const matchAliases =
            Array.isArray(f.aliases) &&
            f.aliases.some((a) => a.toLowerCase().includes(q));

          if (
            !matchName &&
            !matchDesignation &&
            !matchCategory &&
            !matchDivisions &&
            !matchDept &&
            !matchQual &&
            !matchEmail &&
            !matchPhone &&
            !matchBuilding &&
            !matchSubjects &&
            !matchAliases
          ) {
            return false;
          }
        }

        // Department filter
        if (selectedDept !== 'all') {
          if ((f.department_name || 'General Academic') !== selectedDept) {
            return false;
          }
        }

        // Degree / Qualification filter
        if (selectedDegree !== 'all') {
          const qual = (f.qualification || '').toLowerCase();
          if (selectedDegree === 'phd') {
            if (!qual.includes('ph.d') && !qual.includes('phd') && !qual.includes('doctor')) {
              return false;
            }
          } else if (selectedDegree === 'medical') {
            if (
              !qual.includes('md') &&
              !qual.includes('ms') &&
              !qual.includes('dnb') &&
              !qual.includes('mbbs') &&
              !qual.includes('mpt') &&
              !qual.includes('hom') &&
              !qual.includes('ayurved')
            ) {
              return false;
            }
          } else if (selectedDegree === 'engineering') {
            if (
              !qual.includes('m.tech') &&
              !qual.includes('mtech') &&
              !qual.includes('m.e') &&
              !qual.includes('mca') &&
              !qual.includes('engg')
            ) {
              return false;
            }
          } else if (selectedDegree === 'pharmacy') {
            if (!qual.includes('pharm')) {
              return false;
            }
          } else if (selectedDegree === 'management') {
            if (!qual.includes('mba') && !qual.includes('pgdm') && !qual.includes('mha')) {
              return false;
            }
          } else if (selectedDegree === 'law') {
            if (!qual.includes('llm') && !qual.includes('law')) {
              return false;
            }
          } else if (selectedDegree === 'bachelors') {
            if (
              !qual.includes('b.') &&
              !qual.includes('bachelor') &&
              !qual.includes('mbbs') &&
              !qual.includes('bca')
            ) {
              return false;
            }
          }
        }

        // Designation filter
        if (selectedDesignation !== 'all') {
          const desig = (f.designation || '').toLowerCase();
          if (selectedDesignation === 'professor') {
            if (
              !desig.includes('professor') ||
              desig.includes('assistant') ||
              desig.includes('associate')
            ) {
              return false;
            }
          } else if (selectedDesignation === 'associate') {
            if (!desig.includes('associate')) return false;
          } else if (selectedDesignation === 'assistant') {
            if (!desig.includes('assistant') && !desig.includes('lecturer')) return false;
          } else if (selectedDesignation === 'leadership') {
            if (
              !desig.includes('dean') &&
              !desig.includes('director') &&
              !desig.includes('chancellor') &&
              !desig.includes('hod') &&
              !desig.includes('registrar')
            ) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'exp_desc') {
          return (b.experience_months || 0) - (a.experience_months || 0);
        } else if (sortOption === 'exp_asc') {
          return (a.experience_months || 0) - (b.experience_months || 0);
        } else if (sortOption === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (sortOption === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });
  }, [faculty, searchQuery, selectedDept, selectedDegree, selectedDesignation, sortOption]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage) || 1;
  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFaculty, currentPage, itemsPerPage]);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    scrollToTop();
  };

  // Helper: Format experience months into years + months
  const formatExp = (months?: number) => {
    if (months === undefined || months === null || months <= 0) {
      return { full: 'Tenured Academician', short: 'Tenured', years: 0, months: 0 };
    }
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    if (yrs > 0 && mos > 0) {
      return { full: `${yrs} yrs ${mos} mos`, short: `${yrs}.${Math.round((mos / 12) * 10)} Yrs Exp`, years: yrs, months: mos };
    }
    if (yrs > 0) {
      return { full: `${yrs} yrs`, short: `${yrs} Yrs Exp`, years: yrs, months: 0 };
    }
    return { full: `${mos} mos`, short: `${mos} Mos Exp`, years: 0, months: mos };
  };

  // Helper: Initials
  const getInitials = (name: string) => {
    const clean = name
      .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Shri|Smt\.)\s+/i, '')
      .trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.substring(0, 2) || 'PU').toUpperCase();
  };

  // Helper: Avatar dynamic gradient palette
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-indigo-600 to-purple-600',
      'from-emerald-600 to-teal-700',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-violet-600 to-fuchsia-600',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
  };

  // Helper: Qualification badge styling
  const getDegreeBadge = (qualification?: string) => {
    if (!qualification) {
      return {
        label: 'Degree Holder',
        isPhd: false,
        className:
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
    }
    const qLower = qualification.toLowerCase();
    if (qLower.includes('ph.d') || qLower.includes('phd') || qLower.includes('doctor')) {
      return {
        label: 'Ph.D',
        isPhd: true,
        className:
          'bg-amber-100/90 text-amber-900 border-amber-300/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80 font-bold shadow-xs',
      };
    }
    if (qLower.includes('md') || qLower.includes('ms') || qLower.includes('dnb') || qLower.includes('mbbs')) {
      return {
        label: qualification,
        isPhd: false,
        className:
          'bg-teal-100/90 text-teal-900 border-teal-300/80 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800/80 font-semibold',
      };
    }
    if (qLower.includes('m.tech') || qLower.includes('mca') || qLower.includes('m.e')) {
      return {
        label: qualification,
        isPhd: false,
        className:
          'bg-blue-100/90 text-blue-900 border-blue-300/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80 font-semibold',
      };
    }
    if (qLower.includes('pharm')) {
      return {
        label: qualification,
        isPhd: false,
        className:
          'bg-emerald-100/90 text-emerald-900 border-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80 font-semibold',
      };
    }
    if (qLower.includes('mba') || qLower.includes('pgdm')) {
      return {
        label: qualification,
        isPhd: false,
        className:
          'bg-purple-100/90 text-purple-900 border-purple-300/80 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/80 font-semibold',
      };
    }
    return {
      label: qualification,
      isPhd: false,
      className:
        'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium',
    };
  };

  const isFiltered =
    searchQuery !== '' ||
    selectedDept !== 'all' ||
    selectedDegree !== 'all' ||
    selectedDesignation !== 'all' ||
    sortOption !== 'exp_desc';

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 1. Quick Stats Banner / KPI Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="relative overflow-hidden p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 dark:border-slate-800/80 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Faculty
            </span>
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiStats.total.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Teaching & statutory staff
          </p>
        </div>

        <div className="relative overflow-hidden p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:border-slate-800/80 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ph.D. Scholars
            </span>
            <div className="p-2 rounded-xl bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiStats.phdCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Sparkles size={10} /> Doctorates
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Ph.D. & doctoral qualified
          </p>
        </div>

        <div className="relative overflow-hidden p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-teal-50/70 via-white to-teal-50/30 dark:border-slate-800/80 dark:from-teal-950/30 dark:via-slate-900 dark:to-teal-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Avg. Experience
            </span>
            <div className="p-2 rounded-xl bg-teal-600/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiStats.avgExpYears}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Years</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Academic & clinical tenure
          </p>
        </div>

        <div className="relative overflow-hidden p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 dark:border-slate-800/80 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Colleges & Depts
            </span>
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiStats.departmentsCount}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Faculties
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Across campus faculties
          </p>
        </div>
      </div>

      {/* 2. Privacy Alert for Guest Users */}
      {!user && (
        <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-950 dark:text-indigo-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
              <Lock size={14} />
            </div>
            <div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                Direct faculty contact emails & cabin extensions are protected.
              </span>{' '}
              <span className="text-indigo-700/80 dark:text-indigo-300/80">
                Sign in with Google to reveal official university contacts.
              </span>
            </div>
          </div>
          {loginWithGoogle && (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="inline-flex items-center justify-center gap-1.5 font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs cursor-pointer text-xs"
            >
              <UserCheck size={14} />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Filter & Control Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-sm space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty name, degree, department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-9 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => handleFilterChange(setSelectedDept, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            >
              <option value="all">All Departments / Colleges ({departmentStats.length})</option>
              {departmentStats.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name} ({dept.count})
                </option>
              ))}
            </select>
          </div>

          {/* Degree dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedDegree}
              onChange={(e) => handleFilterChange(setSelectedDegree, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            >
              <option value="all">All Degrees</option>
              <option value="phd">🎓 Ph.D / Doctorate</option>
              <option value="medical">⚕️ Medical (MD / MS / MBBS)</option>
              <option value="engineering">💻 Engineering (M.Tech / MCA)</option>
              <option value="pharmacy">💊 Pharmacy (M.Pharm / Pharm.D)</option>
              <option value="management">📊 Management (MBA / PGDM)</option>
              <option value="law">⚖️ Law (LLM)</option>
              <option value="bachelors">🎓 Bachelors Degrees</option>
            </select>
          </div>

          {/* Designation dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedDesignation}
              onChange={(e) => handleFilterChange(setSelectedDesignation, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            >
              <option value="all">All Designations</option>
              <option value="professor">Professors</option>
              <option value="associate">Associate Professors</option>
              <option value="assistant">Assistant Professors</option>
              <option value="leadership">Deans / Directors / Leadership</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="md:col-span-1">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort faculty roster"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            >
              <option value="exp_desc">Exp: High → Low</option>
              <option value="exp_asc">Exp: Low → High</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Reset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredFaculty.length.toLocaleString()}</span> of{' '}
              {faculty.length.toLocaleString()} faculty members
            </span>

            {selectedDept !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium text-[11px] border border-indigo-200 dark:border-indigo-800">
                Dept: {selectedDept}
                <button
                  type="button"
                  onClick={() => setSelectedDept('all')}
                  className="hover:text-indigo-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedDegree !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-800">
                Degree: {selectedDegree.toUpperCase()}
                <button
                  type="button"
                  onClick={() => setSelectedDegree('all')}
                  className="hover:text-amber-950"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedDesignation !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-medium text-[11px] border border-teal-200 dark:border-teal-800">
                Role: {selectedDesignation}
                <button
                  type="button"
                  onClick={() => setSelectedDesignation('all')}
                  className="hover:text-teal-950"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Faculty Cards Grid */}
      {paginatedFaculty.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedFaculty.map((fac, idx) => {
            const exp = formatExp(fac.experience_months);
            const degree = getDegreeBadge(fac.qualification);
            const gradient = getAvatarGradient(fac.name || 'Faculty');
            const initials = getInitials(fac.name || 'PU');

            return (
              <div
                key={fac.id || `fac_${idx}`}
                onClick={() => setActiveModalFaculty(fac)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-indigo-800/70 dark:hover:bg-slate-900/80 cursor-pointer"
              >
                {/* Card Top: Avatar, Degree & Experience Badges */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white dark:ring-slate-900`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
                          {fac.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {fac.designation || 'Faculty Member'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Qualification & Experience Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                    {/* Degree Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${degree.className}`}
                    >
                      {degree.isPhd ? (
                        <Sparkles size={11} className="text-amber-500" />
                      ) : (
                        <GraduationCap size={12} />
                      )}
                      <span>{degree.label}</span>
                    </span>

                    {/* Experience Badge */}
                    {fac.experience_months && fac.experience_months > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70">
                        <Clock size={11} />
                        <span>{exp.full}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        <Briefcase size={11} />
                        <span>Academic Faculty</span>
                      </span>
                    )}

                    {/* Category / Mentor Pill */}
                    {fac.category && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
                        {fac.category}
                      </span>
                    )}

                    {/* Association Type */}
                    {fac.association_type && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                        {fac.association_type}
                      </span>
                    )}
                  </div>

                  {/* Assigned Divisions / Labs */}
                  {fac.assigned_divisions && (
                    <div className="mb-2 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/30 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 truncate">
                      <span className="font-semibold">Div:</span> {fac.assigned_divisions}
                    </div>
                  )}

                  {/* Department & Location */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {fac.department_name || 'Academic Faculty'}
                      </span>
                    </div>
                    {fac.building_name && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        <span className="truncate">
                          {fac.building_name}
                          {fac.room ? ` (Room ${fac.room})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Contact or Unlock prompt */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  {user ? (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                      <Mail size={13} className="text-indigo-500 shrink-0" />
                      <span className="truncate text-[11px]">
                        {fac.email || 'Contact via Department'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium text-[11px]">
                      <Lock size={12} />
                      <span>Sign in for email</span>
                    </div>
                  )}

                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Profile →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
            <Users size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No faculty members found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            We couldn't find any faculty matching your search & filter criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium order-2 sm:order-1">
            Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> (
            {filteredFaculty.length.toLocaleString()} total members)
          </p>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            {/* First Page */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(1)}
              aria-label="First page"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Previous page"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum < 1 || pageNum > totalPages) return null;

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`h-8 min-w-8 px-2 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Next page"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(totalPages)}
              aria-label="Last page"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Detailed Profile Modal */}
      {activeModalFaculty && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Academic profile of ${activeModalFaculty.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveModalFaculty(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModalFaculty(null)}
              aria-label="Close profile modal"
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                  activeModalFaculty.name
                )} text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md`}
              >
                {getInitials(activeModalFaculty.name)}
              </div>
              <div className="min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {activeModalFaculty.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60">
                    <ShieldCheck size={11} /> {activeModalFaculty.category || (activeModalFaculty.id.startsWith('fac_nirf_') ? 'NIRF Verified' : 'University Staff')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {activeModalFaculty.designation || 'Faculty Member'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <Building2 size={12} className="shrink-0" />
                  <span>{activeModalFaculty.department_name || 'Academic Faculty'}</span>
                </p>
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  Highest Degree
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-indigo-600 dark:text-indigo-400" />
                  {activeModalFaculty.qualification || 'Academician'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  Academic Experience
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-teal-600 dark:text-teal-400" />
                  {formatExp(activeModalFaculty.experience_months).full}
                  {activeModalFaculty.experience_months
                    ? ` (${activeModalFaculty.experience_months} mos)`
                    : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  Joining Date
                </span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
                  {activeModalFaculty.joining_date || 'Parul University'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  Association & Status
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  {activeModalFaculty.association_type || 'Regular'} Faculty
                </span>
              </div>
            </div>

            {/* Description / Academic Bio */}
            {activeModalFaculty.description && (
              <div className="mb-6 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block mb-1">
                  Statutory Overview:
                </span>
                {activeModalFaculty.description}
              </div>
            )}

            {/* Campus Contact Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-600" />
                  Campus Contact Information
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ID: {activeModalFaculty.id}
                </span>
              </div>

              {user ? (
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Email:</span>
                    {activeModalFaculty.email ? (
                      <a
                        href={`mailto:${activeModalFaculty.email}`}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {activeModalFaculty.email}
                      </a>
                    ) : (
                      <span className="text-slate-500">Contact via Department Dean Office</span>
                    )}
                  </div>
                  {activeModalFaculty.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Mobile:</span>
                      <a
                        href={`tel:${activeModalFaculty.phone}`}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        +91-{activeModalFaculty.phone}
                      </a>
                    </div>
                  )}
                  {activeModalFaculty.landline_ext && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Landline Ext:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {activeModalFaculty.landline_ext}
                      </span>
                    </div>
                  )}
                  {activeModalFaculty.assigned_divisions && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Assigned:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeModalFaculty.assigned_divisions}
                      </span>
                    </div>
                  )}
                  {activeModalFaculty.building_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Office:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {activeModalFaculty.building_name}
                        {activeModalFaculty.room ? ` (Room ${activeModalFaculty.room})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Lock size={14} className="text-indigo-600 shrink-0" />
                    <span>Protected university email & phone</span>
                  </div>
                  {loginWithGoogle && (
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="inline-flex items-center justify-center gap-1.5 font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 text-xs shadow-xs cursor-pointer"
                    >
                      <UserCheck size={13} />
                      <span>Unlock Contact</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
