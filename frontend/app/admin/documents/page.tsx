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
  Trash2,
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

export default function DocumentsAdminPage() {
  const [activeTab, setActiveTab] = useState<'excel' | 'pdf'>('excel');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pdfCategory, setPdfCategory] = useState('Policy');
  const [stats, setStats] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadTemplate = () => {
    window.open(`${backendUrl}/api/admin/template`, '_blank');
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
        error: err.message || 'Failed to reset Dexa Brain data.',
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
              Upload spreadsheets and official documents to dynamically expand Dexa&apos;s brain without server restarts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowResetModal(true)}
              disabled={isUploading || isResetting}
              variant="outline"
              className="flex items-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 dark:border-rose-800/80 dark:text-rose-400 dark:hover:bg-rose-950/40 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <RotateCcw size={16} className="text-rose-600 dark:text-rose-400" />
              Reset Brain Data
            </Button>
            <Button
              onClick={handleSyncCampusData}
              disabled={isUploading || isResetting}
              variant="outline"
              className="flex items-center gap-2 border-emerald-400/80 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/50 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin text-emerald-700 dark:text-emerald-300" />
              ) : (
                <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
              )}
              Sync campus-data Folder
            </Button>
            <Button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 px-5 py-2.5 rounded-xl font-semibold"
            >
              <Download size={18} />
              Download Excel Template
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

        {/* Ingestion Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <button
              onClick={() => {
                setActiveTab('excel');
                setUploadResult(null);
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'excel'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet size={18} />
              Bulk Excel Upload (.xlsx / .csv)
            </button>

            <button
              onClick={() => {
                setActiveTab('pdf');
                setUploadResult(null);
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'pdf'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={18} />
              PDF Circulars & Handbooks (.pdf)
            </button>
          </div>

          <div className="p-8">
            {/* Tab 1: Excel Ingestion */}
            {activeTab === 'excel' && (
              <div className="space-y-6">
                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-xl p-4 text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">How Excel Ingestion Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800/90 dark:text-blue-300 text-xs">
                    <li>Use our standardized template or upload your campus Excel files (Buildings, Departments, Faculty, Schedules, Services).</li>
                    <li>The system parses each sheet, saves the records into the database, and automatically calculates vector embeddings.</li>
                    <li>The updated places, contacts, and schedules become queryable by students immediately!</li>
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
                          ? 'Processing and embedding Excel data...'
                          : 'Click to select or drag & drop campus Excel file(s)'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select single or multiple files (e.g., Buildings, Departments, Faculty, Schedules, Services)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: PDF Ingestion */}
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
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">Automated PDF Chunking:</p>
                    <p>PDF documents are extracted, split into semantically relevant passages, and embedded into high-dimensional vectors for accurate answer retrieval.</p>
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

            {/* Results & Feedback Banner */}
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
                    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 mt-0.5" size={22} />
                  ) : (
                    <AlertCircle className="text-rose-600 dark:text-rose-400 mt-0.5" size={22} />
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
                        Indexed {uploadResult.chunksIndexed} chunks across {uploadResult.pages} pages into Dexa&apos;s brain.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AdminModal
        isOpen={showResetModal}
        title="Reset Dexa's Brain Data"
        onClose={() => !isResetting && setShowResetModal(false)}
        onSubmit={handleResetBrain}
        submitLabel="Yes, Wipe & Reset Brain"
        submitVariant="danger"
        isLoading={isResetting}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" size={20} />
            <div className="text-xs text-rose-800 dark:text-rose-200 space-y-1 leading-relaxed">
              <p className="font-bold text-sm">Warning: Irreversible Data Purge</p>
              <p>
                This action will completely wipe all ingested records across all layers:
              </p>
              <ul className="list-disc list-inside space-y-0.5 pt-1 text-rose-700 dark:text-rose-300 font-medium">
                <li>All LangChain memory vector embeddings</li>
                <li>In-memory cached buildings, departments, faculty, &amp; schedules</li>
                <li>Disk vector store (<code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded font-mono">precomputed_vectors.json</code>)</li>
                <li>All local JSON database records in <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded font-mono">backend/data/db/</code></li>
                <li>All MongoDB Atlas campus collections</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Once reset, Dexa will have a completely clean slate (0 vectors, 0 places). You can then immediately click <strong>Sync campus-data Folder</strong> or upload fresh Excel/PDF files to re-index cleanly without any duplicate vectors.
          </p>
        </div>
      </AdminModal>
    </AdminLayout>
  );
}

