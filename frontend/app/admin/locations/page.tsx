'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, Search, Loader2, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LocationsAdminPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    short_name: '',
    category: 'academic',
    zone: 'central',
    floors: 1,
    lat: 22.292,
    lng: 73.363,
    description: '',
  });

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const adminKey =
    process.env.NEXT_PUBLIC_ADMIN_KEY || 'soikjdascmklsdjnviosbnjk';

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/campus/locations`);
      const json = await res.json();
      if (json.success) {
        setLocations(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenModal = (location?: any) => {
    if (location) {
      setEditingId(location.id || location.code);
      setFormData({
        id: location.id || '',
        code: location.code || location.id || '',
        name: location.name || '',
        short_name: location.short_name || location.name || '',
        category: location.category || 'academic',
        zone: location.zone || 'central',
        floors: location.floors || 1,
        lat: Number(location.lat) || 22.292,
        lng: Number(location.lng) || 73.363,
        description: location.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        code: '',
        name: '',
        short_name: '',
        category: 'academic',
        zone: 'central',
        floors: 1,
        lat: 22.292,
        lng: 73.363,
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
        id: editingId || formData.code || `bld_${Date.now()}`,
      };

      const res = await fetch(`${backendUrl}/api/admin/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        await fetchLocations();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to save location:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (location: any) => {
    const targetId = location.id || location.code;
    if (confirm(`Delete location "${location.name}" (${targetId})?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/locations/${targetId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-key': adminKey,
          },
        });
        const json = await res.json();
        if (json.success) {
          setLocations((prev) => prev.filter((b) => (b.id || b.code) !== targetId));
        }
      } catch (err) {
        console.error('Failed to delete location:', err);
      }
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    return (
      (loc.name && loc.name.toLowerCase().includes(q)) ||
      (loc.code && loc.code.toLowerCase().includes(q)) ||
      (loc.zone && loc.zone.toLowerCase().includes(q)) ||
      (loc.category && loc.category.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Campus Buildings & Locations
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live records from Parul University database ({locations.length} buildings indexed)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchLocations}
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
              Add Building
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buildings by name, code, or zone..."
            className="pl-10 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading live campus buildings...</p>
          </div>
        ) : (
          <AdminTable
            columns={[
              {
                key: 'code',
                label: 'Code',
                render: (_, row) => (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {row.code || row.id}
                  </span>
                ),
              },
              {
                key: 'name',
                label: 'Building Name',
                render: (_, row) => (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {row.name}
                    </span>
                    {row.short_name && row.short_name !== row.name && (
                      <span className="text-xs text-slate-400 ml-2">({row.short_name})</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'zone',
                label: 'Zone',
                render: (_, row) => (
                  <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-300">
                    {row.zone || 'Central'}
                  </span>
                ),
              },
              {
                key: 'category',
                label: 'Type',
                render: (_, row) => (
                  <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {row.category || 'Academic'}
                  </span>
                ),
              },
              {
                key: 'coordinates',
                label: 'Coordinates',
                render: (_, row) => (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {typeof row.lat === 'number' ? row.lat.toFixed(4) : '22.292'},{' '}
                    {typeof row.lng === 'number' ? row.lng.toFixed(4) : '73.363'}
                  </span>
                ),
              },
            ]}
            data={filteredLocations}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Campus Building' : 'Add New Building'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          isLoading={isSaving}
          submitLabel={editingId ? 'Update & Index' : 'Save & Index'}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Building Code*
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., A25"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="academic / admin / sports"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Building Name*
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., C.V. Raman Centre"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zone
                </label>
                <Input
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="north / south / central"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Floors
                </label>
                <Input
                  type="number"
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: Number(e.target.value) || 1 })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  placeholder="22.292278"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  placeholder="73.363257"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key labs, departments, or facilities housed here..."
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
