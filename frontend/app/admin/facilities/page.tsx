'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FacilitiesAdminPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Academic',
    building_name: '',
    floor: '',
    hours: '8:00 AM - 6:00 PM',
    description: '',
  });

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const adminKey =
    process.env.NEXT_PUBLIC_ADMIN_KEY || 'soikjdascmklsdjnviosbnjk';

  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/campus/facilities`);
      const json = await res.json();
      if (json.success) {
        setFacilities(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleOpenModal = (facility?: any) => {
    if (facility) {
      setEditingId(facility.id);
      setFormData({
        id: facility.id || '',
        name: facility.name || '',
        category: facility.category || 'General',
        building_name: facility.building_name || facility.location || '',
        floor: facility.floor || '',
        hours: facility.hours || '8:00 AM - 6:00 PM',
        description: facility.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        name: '',
        category: 'Academic',
        building_name: '',
        floor: '',
        hours: '8:00 AM - 6:00 PM',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        id: editingId || `fac_${Date.now()}`,
      };

      const res = await fetch(`${backendUrl}/api/admin/facilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        await fetchFacilities();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to save facility:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (facility: any) => {
    if (confirm(`Delete facility "${facility.name}"?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/facilities/${facility.id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-key': adminKey,
          },
        });
        const json = await res.json();
        if (json.success) {
          setFacilities((prev) => prev.filter((f) => f.id !== facility.id));
        }
      } catch (err) {
        console.error('Failed to delete facility:', err);
      }
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.category && f.category.toLowerCase().includes(q)) ||
      (f.building_name && f.building_name.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Campus Facilities Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live records from Parul University database ({facilities.length} facilities indexed)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchFacilities}
              disabled={isLoading}
              className="flex items-center gap-1.5 dark:border-slate-700"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Plus size={18} />
              Add Facility
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facilities by name, category, or building..."
            className="pl-10 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading live facilities...</p>
          </div>
        ) : (
          <AdminTable
            columns={[
              {
                key: 'name',
                label: 'Facility Name',
                render: (_, row) => (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {row.name}
                    </span>
                    {row.description && (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{row.description}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'category',
                label: 'Category',
                render: (_, row) => (
                  <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {row.category || 'General'}
                  </span>
                ),
              },
              {
                key: 'building_name',
                label: 'Location / Building',
                render: (_, row) => (
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {row.building_name || 'Campus Wide'}
                    {row.floor ? ` (Floor ${row.floor})` : ''}
                  </span>
                ),
              },
              {
                key: 'hours',
                label: 'Operating Hours',
                render: (_, row) => (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {row.hours || 'Standard Hours'}
                  </span>
                ),
              },
            ]}
            data={filteredFacilities}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Facility' : 'Add New Facility'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          isLoading={isSaving}
          submitLabel={editingId ? 'Update & Index' : 'Save & Index'}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facility Name*
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Central Library Reading Hall"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Library / Lab / Food Court"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Floor
                </label>
                <Input
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g., 2 or Ground Floor"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Building Name
              </label>
              <Input
                value={formData.building_name}
                onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                placeholder="e.g., C.V. Raman Centre"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operating Hours
              </label>
              <Input
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g., 8:00 AM - 8:00 PM"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description & Amenities
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="WiFi, Air Conditioning, Seating for 200+..."
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
