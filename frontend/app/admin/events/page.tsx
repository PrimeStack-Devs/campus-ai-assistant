'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, RefreshCw, Calendar } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EventsAdminPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: 'All Day',
    location: 'Parul University',
    description: '',
    category: 'Academic',
  });

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const adminKey =
    process.env.NEXT_PUBLIC_ADMIN_KEY || 'soikjdascmklsdjnviosbnjk';

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/campus/events`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenModal = (event?: any) => {
    if (event) {
      setEditingTitle(event.title);
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || 'All Day',
        location: event.location || 'Parul University',
        description: event.description || '',
        category: event.category || 'Academic',
      });
    } else {
      setEditingTitle(null);
      setFormData({
        title: '',
        date: '',
        time: 'All Day',
        location: 'Parul University',
        description: '',
        category: 'Academic',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        await fetchEvents();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to save event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: any) => {
    if (confirm(`Delete event "${event.title}"?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/events/${encodeURIComponent(event.title)}`, {
          method: 'DELETE',
          headers: {
            'x-admin-key': adminKey,
          },
        });
        const json = await res.json();
        if (json.success) {
          setEvents((prev) => prev.filter((e) => e.title !== event.title));
        }
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.date && e.date.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Academic Calendar & Events
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live records from Parul University schedules & academic calendar ({events.length} milestones)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchEvents}
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
              Add Event
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, exams, or holidays..."
            className="pl-10 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading university calendar events...</p>
          </div>
        ) : (
          <AdminTable
            columns={[
              {
                key: 'title',
                label: 'Event / Milestone',
                render: (_, row) => (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      {row.title}
                    </span>
                    {row.description && (
                      <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{row.description}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'date',
                label: 'Scheduled Date',
                render: (_, row) => (
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {row.date}
                  </span>
                ),
              },
              {
                key: 'category',
                label: 'Category',
                render: (_, row) => (
                  <span
                    className={`capitalize text-xs font-medium px-2 py-0.5 rounded ${
                      row.category === 'Holidays'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : row.category === 'Exams'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {row.category || 'Academic'}
                  </span>
                ),
              },
              {
                key: 'location',
                label: 'Location',
                render: (_, row) => (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {row.location || 'Parul University'}
                  </span>
                ),
              },
            ]}
            data={filteredEvents}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <AdminModal
          isOpen={isModalOpen}
          title={editingTitle ? 'Edit Calendar Event' : 'Add Calendar Event'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          isLoading={isSaving}
          submitLabel={editingTitle ? 'Update & Index' : 'Save & Index'}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event / Milestone Title*
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., End Semester Examination Window"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date / Timeframe*
                </label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., Nov 25 - Dec 10, 2025"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs"
                >
                  <option value="Academic">Academic</option>
                  <option value="Exams">Exams</option>
                  <option value="Holidays">Holidays</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Campus-wide or specific Institute"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Guidelines, attendance requirements, or holiday details..."
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
