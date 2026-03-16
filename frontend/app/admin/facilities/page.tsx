'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { facilityApi } from '@/lib/adminApi';

export default function FacilitiesAdminPage() {
  const [facilities, setFacilities] = useState(facilityApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hours: '',
    location: '',
    amenities: [] as string[],
  });
  const [amenityInput, setAmenityInput] = useState('');

  const handleOpenModal = (facility?: any) => {
    if (facility) {
      setEditingId(facility.id);
      setFormData(facility);
    } else {
      setEditingId(null);
      setFormData({ name: '', hours: '', location: '', amenities: [] });
    }
    setAmenityInput('');
    setIsModalOpen(true);
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput],
      });
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (editingId) {
      facilityApi.update(editingId, formData);
    } else {
      facilityApi.create(formData);
    }
    setFacilities(facilityApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (facility: any) => {
    if (confirm(`Delete facility "${facility.name}"?`)) {
      facilityApi.delete(facility.id);
      setFacilities(facilityApi.getAll());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Facilities Management</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus size={20} />
            Add Facility
          </Button>
        </div>

        <AdminTable
          columns={[
            { key: 'name', label: 'Facility Name' },
            { key: 'location', label: 'Location' },
            { key: 'hours', label: 'Hours' },
            {
              key: 'amenities',
              label: 'Amenities',
              render: (value) => <span className="text-sm">{value.length} amenities</span>,
            },
          ]}
          data={facilities}
          onEdit={() => {}}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Facility' : 'Create Facility'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Facility Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Science Library"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Science Building, 2nd Floor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hours</label>
              <Input
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g., 8:00 AM - 11:00 PM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amenities</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="Add amenity"
                    onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                  />
                  <Button onClick={addAmenity} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, idx) => (
                    <div key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                      {amenity}
                      <button onClick={() => removeAmenity(idx)} className="hover:text-blue-900">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
