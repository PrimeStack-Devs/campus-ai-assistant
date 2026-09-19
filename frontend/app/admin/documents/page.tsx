'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Building,
  GraduationCap,
  Users,
  RotateCcw,
  MapPin,
  Compass,
  ShieldCheck,
  Bus,
  Clock,
  Calendar,
  CalendarCheck,
  Sun,
  FileCheck,
  Eye,
  Archive,
  Search,
  Filter,
  ArrowRight,
  FolderDown,
  Info,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface UploadResult {
  success: boolean;
  message?: string;
  summary?: Record<string, number>;
  totalNewVectors?: number;
  files?: string[];
  filename?: string;
  chunksIndexed?: number;
  pages?: number;
  error?: string;
}

interface TemplateField {
  key: string;
  required: boolean;
  description: string;
}

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  sheetName: string;
  icon: string;
  description: string;
  fieldCount: number;
  fields: TemplateField[];
  sampleData: Record<string, any>[];
  downloadUrls: {
    xlsx: string;
    csv: string;
  };
}

export default function DocumentsAdminPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'excel' | 'pdf'>('templates');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pdfCategory, setPdfCategory] = useState('Policy');
  const [stats, setStats] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Template Hub State
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [masterInfo, setMasterInfo] = useState<any>(null);
  const [bundleInfo, setBundleInfo] = useState<any>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<TemplateItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'schema' | 'sample'>('schema');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const { getAuthHeaders } = useAdminAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/templates`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        setMasterInfo(data.masterTemplate);
        setBundleInfo(data.bundle);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTemplates();

    // Check query params for initial tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'excel' || tabParam === 'pdf' || tabParam === 'templates') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const handleDownloadMaster = () => {
    window.open(`${backendUrl}/api/admin/templates/master/download`, '_blank');
  };

  const handleDownloadBundle = () => {
    window.open(`${backendUrl}/api/admin/templates/bundle/zip`, '_blank');
  };

  const handleDownloadTemplateFile = (id: string, format: 'xlsx' | 'csv') => {
    window.open(
      `${backendUrl}/api/admin/templates/${id}/download?format=${format}`,
      '_blank'
    );
  };

  const handleResetBrain = async () => {
    setIsResetting(true);
    setUploadResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/admin/reset-brain`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        setShowResetModal(false);
        fetchStats();
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message || 'Failed to reset Kryvix Brain data.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSyncCampusData = async () => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/admin/sync-campus-data`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        fetchStats();
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message || 'Failed to sync campus data folder.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }

    try {
      const res = await fetch(`${backendUrl}/api/admin/upload-excel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        fetchStats();
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message || 'Failed to upload Excel file(s).',
      });
    } finally {
      setIsUploading(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', pdfCategory);

    try {
      const res = await fetch(`${backendUrl}/api/admin/upload-pdf`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        fetchStats();
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message || 'Failed to upload PDF file.',
      });
    } finally {
      setIsUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // Helper icon renderer
  const renderTemplateIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'Building':
        return <Building size={size} />;
      case 'MapPin':
        return <MapPin size={size} />;
      case 'Users':
        return <Users size={size} />;
      case 'GraduationCap':
        return <GraduationCap size={size} />;
      case 'Compass':
        return <Compass size={size} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} />;
      case 'Bus':
        return <Bus size={size} />;
      case 'Clock':
        return <Clock size={size} />;
      case 'Calendar':
        return <Calendar size={size} />;
      case 'CalendarCheck':
        return <CalendarCheck size={size} />;
      case 'Sun':
        return <Sun size={size} />;
      case 'FileCheck':
        return <FileCheck size={size} />;
      default:
        return <FileSpreadsheet size={size} />;
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sheetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fields.some((f) => f.key.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    'All',
    'Infrastructure & Places',
    'Academic & People',
    'Navigation & Campus Map',
    'Services & Amenities',
    'Transport & Logistics',
    'Academic & Schedules',
    'Regulations & Rules',
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Data Ingestion Hub
              </h1>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> AI Vector Indexed
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Download standardized Excel/CSV templates, ingest campus spreadsheets, and embed official circulars in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setShowResetModal(true)}
              disabled={isUploading || isResetting}
              variant="outline"
              className="flex items-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 dark:border-rose-800/80 dark:text-rose-400 dark:hover:bg-rose-950/40 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all"
            >
              <RotateCcw size={15} className="text-rose-600 dark:text-rose-400" />
              Reset Brain
            </Button>
            <Button
              onClick={handleSyncCampusData}
              disabled={isUploading || isResetting}
              variant="outline"
              className="flex items-center gap-2 border-emerald-400/80 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/50 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all"
            >
              {isUploading ? (
                <Loader2 size={15} className="animate-spin text-emerald-700 dark:text-emerald-300" />
              ) : (
                <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400" />
              )}
              Sync data/excel
            </Button>
            <Button
              onClick={handleDownloadBundle}
              variant="outline"
              className="flex items-center gap-2 border-purple-300 bg-purple-50/70 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 font-semibold px-4 py-2 rounded-xl text-xs shadow-xs transition-all"
            >
              <Archive size={15} className="text-purple-600 dark:text-purple-400" />
              Download All (.zip)
            </Button>
            <Button
              onClick={handleDownloadMaster}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 px-4 py-2 rounded-xl font-semibold text-xs"
            >
              <Download size={15} />
              Master Template (.xlsx)
            </Button>
          </div>
        </div>

        {/* Live Vector Stats Strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg">
                <Building size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Buildings</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.buildings}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 rounded-lg">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Departments</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.departments}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Faculty</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.faculty}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Vectors</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.vectorChunks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hub Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('templates');
                setUploadResult(null);
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FolderDown size={18} />
              Template Library &amp; Downloads
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full font-bold">
                12 Standard Types
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('excel');
                setUploadResult(null);
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'excel'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet size={18} />
              Bulk Spreadsheet Upload (.xlsx / .csv)
            </button>

            <button
              onClick={() => {
                setActiveTab('pdf');
                setUploadResult(null);
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'pdf'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={18} />
              PDF Circulars &amp; Handbooks (.pdf)
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* TAB 0: TEMPLATE LIBRARY & DOWNLOADS */}
            {activeTab === 'templates' && (
              <div className="space-y-8">
                {/* Hero Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Master Template Card */}
                  <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white border border-blue-800/60 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
                        <FileSpreadsheet size={28} />
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xl font-extrabold text-white">
                        All-in-One Master Template
                      </h3>
                      <p className="text-xs text-blue-200/90 leading-relaxed">
                        A single multi-sheet Excel workbook containing all 12 campus data categories (Buildings, Facilities, Faculty, Departments, Paths, Services, Schedules, Policies) with instructions and validation examples.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-300">
                        campus_master_template.xlsx
                      </span>
                      <Button
                        onClick={handleDownloadMaster}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/30"
                      >
                        <Download size={14} />
                        Download .XLSX
                      </Button>
                    </div>
                  </div>

                  {/* ZIP Bundle Card */}
                  <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-900 via-slate-950 to-slate-900 text-white border border-purple-800/60 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                        <Archive size={28} />
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full">
                        Complete Pack
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xl font-extrabold text-white">
                        Complete Templates Package (.zip)
                      </h3>
                      <p className="text-xs text-purple-200/90 leading-relaxed">
                        Download all 12 individual `.xlsx` workbooks, 11 standalone `.csv` templates, the master workbook, and the comprehensive schema guide in one instant ZIP archive.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs font-mono text-purple-300">
                        campus_all_templates.zip (24 files)
                      </span>
                      <Button
                        onClick={handleDownloadBundle}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/30"
                      >
                        <Download size={14} />
                        Download All (.zip)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search templates (e.g. faculty, bus, paths, policies)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Category Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <Filter size={14} className="text-slate-400 shrink-0 mr-1" />
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          categoryFilter === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates Grid */}
                {isLoadingTemplates ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Loading standardized campus templates...
                    </p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 space-y-2">
                    <AlertCircle className="mx-auto text-slate-400" size={28} />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No templates match your search filter
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Try clearing your search query or selecting &quot;All&quot; categories.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 transition-transform">
                              {renderTemplateIcon(template.icon, 22)}
                            </div>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                              {template.category}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                              {template.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>
                          </div>

                          {/* Schema Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 font-medium">
                              Sheet: {template.sheetName}
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                              {template.fieldCount} Columns
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleDownloadTemplateFile(template.id, 'xlsx')}
                              variant="outline"
                              className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8.5 rounded-lg border-emerald-300/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                            >
                              <Download size={13} />
                              .XLSX
                            </Button>
                            <Button
                              onClick={() => handleDownloadTemplateFile(template.id, 'csv')}
                              variant="outline"
                              className="text-xs font-semibold flex items-center justify-center gap-1.5 h-8.5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Download size={13} />
                              .CSV
                            </Button>
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedTemplateForPreview(template);
                              setPreviewTab('schema');
                            }}
                            variant="ghost"
                            className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 h-8 rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <Eye size={13} />
                            Preview Schema &amp; Sample Data
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Next Step Guide */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                      Ready to Ingest Your Records?
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Download any of the templates above, add or modify rows, then switch directly to the <strong>Bulk Spreadsheet Upload</strong> tab. Kryvix will parse your files, validate columns, and update the AI vector store immediately.
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('excel')}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    Go to Bulk Upload
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 1: EXCEL / CSV INGESTION */}
            {activeTab === 'excel' && (
              <div className="space-y-6">
                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-xl p-4 text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">How Spreadsheet Ingestion Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800/90 dark:text-blue-300 text-xs">
                    <li>Upload single or multiple files in <strong>.xlsx</strong> or <strong>.csv</strong> format.</li>
                    <li>Supports any template type (Buildings, Facilities, Faculty, Departments, Paths, Services, Schedules, Policies).</li>
                    <li>Kryvix automatically detects the entity type by sheet name or column signatures, saves to the database, and computes high-dimensional vector embeddings on the fly!</li>
                  </ul>
                </div>

                <div
                  onClick={() => !isUploading && excelInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isUploading
                      ? 'border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-500 dark:border-blue-800/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:hover:border-blue-500'
                  }`}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    multiple
                    onChange={handleExcelUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-2xl">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={36} />
                      ) : (
                        <FileSpreadsheet size={36} />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {isUploading
                          ? 'Processing and embedding campus data...'
                          : 'Click to select or drag & drop campus Excel / CSV file(s)'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select single or multiple files (e.g. Buildings, Departments, Faculty, Schedules, Services, Policies)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PDF INGESTION */}
            {activeTab === 'pdf' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Document Category
                    </label>
                    <select
                      value={pdfCategory}
                      onChange={(e) => setPdfCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Policy">Campus Policy / Rules</option>
                      <option value="Academic">Academic Handbook / Syllabus</option>
                      <option value="Hostel">Hostel Regulations</option>
                      <option value="Exam">Examination Circular</option>
                      <option value="General">General Information</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                      Automated PDF Chunking:
                    </p>
                    <p>
                      PDF documents are extracted, split into semantically relevant passages, and embedded into high-dimensional vectors for accurate answer retrieval.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => !isUploading && pdfInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isUploading
                      ? 'border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 cursor-not-allowed'
                      : 'border-indigo-300 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-500 dark:border-indigo-800/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-500'
                  }`}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-2xl">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={36} />
                      ) : (
                        <Upload size={36} />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {isUploading
                          ? 'Extracting text and generating vectors...'
                          : 'Click to select or drag & drop official PDF circular'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Supports PDF files (Handbooks, Policies, Circulars) up to 25MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Results & Feedback Banner */}
            {uploadResult && (
              <div
                className={`mt-6 p-5 rounded-xl border transition-all ${
                  uploadResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {uploadResult.success ? (
                    <CheckCircle2
                      className="text-emerald-600 dark:text-emerald-400 mt-0.5"
                      size={22}
                    />
                  ) : (
                    <AlertCircle
                      className="text-rose-600 dark:text-rose-400 mt-0.5"
                      size={22}
                    />
                  )}

                  <div className="space-y-2">
                    <p className="font-bold text-sm">
                      {uploadResult.success
                        ? 'Ingestion Completed Successfully!'
                        : 'Upload Failed'}
                    </p>
                    <p className="text-xs opacity-90">
                      {uploadResult.message || uploadResult.error}
                    </p>

                    {uploadResult.files && uploadResult.files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Processed Files:
                        </span>
                        {uploadResult.files.map((file, i) => (
                          <span
                            key={i}
                            className="bg-white/90 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 text-xs px-2 py-0.5 rounded font-mono"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    )}

                    {uploadResult.summary && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(uploadResult.summary).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-md font-semibold capitalize"
                          >
                            {k}: {v} records
                          </span>
                        ))}
                        {uploadResult.totalNewVectors !== undefined && (
                          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-md font-semibold">
                            +{uploadResult.totalNewVectors} Vectors Embedded
                          </span>
                        )}
                      </div>
                    )}

                    {uploadResult.chunksIndexed !== undefined && (
                      <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 pt-1">
                        Indexed {uploadResult.chunksIndexed} chunks across {uploadResult.pages} pages into Kryvix&apos;s brain.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview & Schema Inspector Modal */}
      {selectedTemplateForPreview && (
        <AdminModal
          isOpen={Boolean(selectedTemplateForPreview)}
          title={`${selectedTemplateForPreview.title} — Template Schema & Preview`}
          onClose={() => setSelectedTemplateForPreview(null)}
          submitLabel={`Download .XLSX`}
          onSubmit={() =>
            handleDownloadTemplateFile(selectedTemplateForPreview.id, 'xlsx')
          }
        >
          <div className="space-y-5">
            {/* Modal Subheader */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Target Sheet Name:
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedTemplateForPreview.sheetName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    handleDownloadTemplateFile(
                      selectedTemplateForPreview.id,
                      'xlsx'
                    )
                  }
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1"
                >
                  <Download size={13} />
                  .XLSX
                </Button>
                <Button
                  onClick={() =>
                    handleDownloadTemplateFile(
                      selectedTemplateForPreview.id,
                      'csv'
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 rounded-lg flex items-center gap-1"
                >
                  <Download size={13} />
                  .CSV
                </Button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPreviewTab('schema')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  previewTab === 'schema'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Column Schema ({selectedTemplateForPreview.fields.length} Fields)
              </button>
              <button
                onClick={() => setPreviewTab('sample')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  previewTab === 'sample'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Sample Data Records ({selectedTemplateForPreview.sampleData.length} Rows)
              </button>
            </div>

            {/* Tab 1: Column Schema Table */}
            {previewTab === 'schema' && (
              <div className="max-h-[380px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Column Header</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Data Description / Guidelines</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {selectedTemplateForPreview.fields.map((field, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {field.key}
                        </td>
                        <td className="py-2.5 px-3">
                          {field.required ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              Required *
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {field.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Sample Rows Preview */}
            {previewTab === 'sample' && (
              <div className="max-h-[380px] overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {selectedTemplateForPreview.fields.map((f, i) => (
                        <th key={i} className="py-2.5 px-3 font-mono">
                          {f.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedTemplateForPreview.sampleData.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {selectedTemplateForPreview.fields.map((f, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[240px] truncate"
                          >
                            {row[f.key] !== undefined && row[f.key] !== null
                              ? String(row[f.key])
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Reset Confirmation Modal */}
      <AdminModal
        isOpen={showResetModal}
        title="Reset Kryvix's Brain Data"
        onClose={() => !isResetting && setShowResetModal(false)}
        onSubmit={handleResetBrain}
        submitLabel="Yes, Wipe & Reset Brain"
        submitVariant="danger"
        isLoading={isResetting}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-start gap-3">
            <AlertCircle
              className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0"
              size={20}
            />
            <div className="text-xs text-rose-800 dark:text-rose-200 space-y-1 leading-relaxed">
              <p className="font-bold text-sm">Warning: Irreversible Data Purge</p>
              <p>
                This action will completely wipe all ingested records across all layers:
              </p>
              <ul className="list-disc list-inside space-y-0.5 pt-1 text-rose-700 dark:text-rose-300 font-medium">
                <li>All LangChain memory vector embeddings</li>
                <li>In-memory cached buildings, departments, faculty, &amp; schedules</li>
                <li>
                  Disk vector store (
                  <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded font-mono">
                    precomputed_vectors.json
                  </code>
                  )
                </li>
                <li>
                  All local JSON database records in{' '}
                  <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded font-mono">
                    backend/data/db/
                  </code>
                </li>
                <li>All MongoDB Atlas campus collections</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Once reset, Kryvix will have a completely clean slate (0 vectors, 0 places). You can then immediately click <strong>Sync data/excel</strong> or upload fresh Excel/CSV files to re-index cleanly without any duplicate vectors.
          </p>
        </div>
      </AdminModal>
    </AdminLayout>
  );
}
