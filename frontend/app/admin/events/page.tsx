'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { eventApi } from '@/lib/adminApi';

export default function EventsAdminPage() {
  const [events, setEvents] = useState(eventApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'academic',
  });

  const handleOpenModal = (event?: any) => {
    if (event) {
      setEditingId(event.id);
      setFormData(event);
    } else {
      setEditingId(null);
      setFormData({ title: '', date: '', time: '', location: '', description: '', category: 'academic' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      eventApi.update(editingId, formData);
    } else {
      eventApi.create(formData);
    }
    setEvents(eventApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (event: any) => {
    if (confirm(`Delete event "${event.title}"?`)) {
      eventApi.delete(event.id);
      setEvents(eventApi.getAll());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Events Management</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus size={20} />
            Add Event
          </Button>
        </div>

        <AdminTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'date', label: 'Date' },
            { key: 'location', label: 'Location' },
            {
              key: 'category',
              label: 'Category',
              render: (value) => <span className="capitalize">{value}</span>,
            },
          ]}
          data={events}
          onEdit={() => {}}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Event' : 'Create Event'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="March 15, 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <Input
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="10:00 AM"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="academic">Academic</option>
                <option value="social">Social</option>
                <option value="sports">Sports</option>
                <option value="careers">Careers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
