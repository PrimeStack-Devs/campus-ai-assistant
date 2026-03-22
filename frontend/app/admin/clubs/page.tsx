'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clubApi } from '@/lib/adminApi';

export default function ClubsAdminPage() {
  const [clubs, setClubs] = useState(clubApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    members: 0,
    meets: '',
    description: '',
  });

  const handleOpenModal = (club?: any) => {
    if (club) {
      setEditingId(club.id);
      setFormData(club);
    } else {
      setEditingId(null);
      setFormData({ name: '', members: 0, meets: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      clubApi.update(editingId, formData);
    } else {
      clubApi.create(formData);
    }
    setClubs(clubApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (club: any) => {
    if (confirm(`Delete club "${club.name}"?`)) {
      clubApi.delete(club.id);
      setClubs(clubApi.getAll());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Clubs Management</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus size={20} />
            Add Club
          </Button>
        </div>

        <AdminTable
          columns={[
            { key: 'name', label: 'Club Name' },
            { key: 'description', label: 'Description' },
            {
              key: 'members',
              label: 'Members',
              render: (value) => <span className="font-semibold text-slate-900">{value}</span>,
            },
            { key: 'meets', label: 'Meets' },
          ]}
          data={clubs}
          onEdit={() => {}}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Club' : 'Create Club'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Club Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Coding Club"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Club description"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Members</label>
                <Input
                  type="number"
                  value={formData.members}
                  onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meets</label>
                <Input
                  value={formData.meets}
                  onChange={(e) => setFormData({ ...formData, meets: e.target.value })}
                  placeholder="e.g., Thursdays 6 PM"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
