'use client';

import { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { locationApi } from '@/lib/adminApi';

export default function LocationsAdminPage() {
  const [locations, setLocations] = useState(locationApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    type: '',
  });

  const handleOpenModal = (location?: any) => {
    if (location) {
      setEditingId(location.id);
      setFormData(location);
    } else {
      setEditingId(null);
      setFormData({ name: '', latitude: 0, longitude: 0, type: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      locationApi.update(editingId, formData);
    } else {
      locationApi.create(formData);
    }
    setLocations(locationApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (location: any) => {
    if (confirm(`Delete location "${location.name}"?`)) {
      locationApi.delete(location.id);
      setLocations(locationApi.getAll());
    }
  };

  const MapPreview = ({ lat, lng }: { lat: number; lng: number }) => (
    <div className="w-full h-40 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
      <div className="text-center">
        <MapPin className="mx-auto mb-2 text-blue-600" size={32} />
        <p className="text-sm text-slate-600">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Locations Management</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus size={20} />
            Add Location
          </Button>
        </div>

        <AdminTable
          columns={[
            { key: 'name', label: 'Location Name' },
            { key: 'type', label: 'Type' },
            {
              key: 'latitude',
              label: 'Coordinates',
              render: (_, row) => (
                <span className="text-sm">{row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}</span>
              ),
            },
          ]}
          data={locations}
          onEdit={() => {}}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Location' : 'Create Location'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Science Building"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Academic"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  placeholder="40.8067"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  placeholder="-73.9629"
                />
              </div>
            </div>
            <MapPreview lat={formData.latitude} lng={formData.longitude} />
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
