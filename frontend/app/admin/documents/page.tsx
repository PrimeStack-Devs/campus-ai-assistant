'use client';

import { useState } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentApi } from '@/lib/adminApi';

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState(documentApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'pdf',
    uploadedDate: new Date().toISOString().split('T')[0],
    size: '0 MB',
  });

  const handleOpenModal = () => {
    setFormData({
      title: '',
      type: 'pdf',
      uploadedDate: new Date().toISOString().split('T')[0],
      size: '0 MB',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    documentApi.create(formData);
    setDocuments(documentApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (doc: any) => {
    if (confirm(`Delete document "${doc.title}"?`)) {
      documentApi.delete(doc.id);
      setDocuments(documentApi.getAll());
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Documents Management</h1>
          <Button onClick={handleOpenModal} className="flex items-center gap-2">
            <Plus size={20} />
            Upload Document
          </Button>
        </div>

        <AdminTable
          columns={[
            {
              key: 'title',
              label: 'Document Title',
              render: (value) => (
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span>{value}</span>
                </div>
              ),
            },
            { key: 'type', label: 'Type', render: (value) => <span className="uppercase text-xs font-semibold text-slate-600">{value}</span> },
            { key: 'uploadedDate', label: 'Uploaded' },
            { key: 'size', label: 'Size' },
          ]}
          data={documents}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title="Upload Document"
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 2024 Academic Calendar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload File</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX (Max 10MB)</p>
                <input type="file" className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">Document</option>
                  <option value="sheet">Spreadsheet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Date</label>
                <Input
                  type="date"
                  value={formData.uploadedDate}
                  onChange={(e) => setFormData({ ...formData, uploadedDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
