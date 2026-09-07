'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, RefreshCw, Mail, Building } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactsAdminPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    designation: 'Assistant Professor',
    department_name: '',
    building_name: '',
    email: '',
    phone: '',
    room: '',
  });

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const adminKey =
    process.env.NEXT_PUBLIC_ADMIN_KEY || 'soikjdascmklsdjnviosbnjk';

  const fetchFaculty = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/campus/faculty`);
      const json = await res.json();
      if (json.success) {
        setFacultyList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleOpenModal = (faculty?: any) => {
    if (faculty) {
      setEditingId(faculty.id);
      setFormData({
        id: faculty.id || '',
        name: faculty.name || '',
        designation: faculty.designation || 'Assistant Professor',
        department_name: faculty.department_name || '',
        building_name: faculty.building_name || '',
        email: faculty.email || '',
        phone: faculty.phone || '',
        room: faculty.room || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        name: '',
        designation: 'Assistant Professor',
        department_name: '',
        building_name: '',
        email: '',
        phone: '',
        room: '',
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

      const res = await fetch(`${backendUrl}/api/admin/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        await fetchFaculty();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to save faculty contact:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (faculty: any) => {
    if (confirm(`Delete faculty "${faculty.name}"?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/contacts/${faculty.id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-key': adminKey,
          },
        });
        const json = await res.json();
        if (json.success) {
          setFacultyList((prev) => prev.filter((f) => f.id !== faculty.id));
        }
      } catch (err) {
        console.error('Failed to delete faculty:', err);
      }
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.designation && f.designation.toLowerCase().includes(q)) ||
      (f.department_name && f.department_name.toLowerCase().includes(q)) ||
      (f.building_name && f.building_name.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Faculty & Campus Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live records from Parul University faculty directory ({facultyList.length} faculty indexed)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchFaculty}
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
              Add Faculty
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name, department, or designation..."
            className="pl-10 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading live faculty contacts...</p>
          </div>
        ) : (
          <AdminTable
            columns={[
              {
                key: 'name',
                label: 'Faculty Name',
                render: (_, row) => (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {row.name}
                    </span>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {row.designation || 'Faculty'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'department_name',
                label: 'Department',
                render: (_, row) => (
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {row.department_name || 'General Academic'}
                  </span>
                ),
              },
              {
                key: 'building_name',
                label: 'Office / Building',
                render: (_, row) => (
                  <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Building size={12} className="shrink-0 text-slate-400" />
                    {row.building_name || 'Academic Block'}
                    {row.room ? ` (Room ${row.room})` : ''}
                  </span>
                ),
              },
              {
                key: 'email',
                label: 'Email & Contact',
                render: (_, row) => (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Mail size={12} />
                        {row.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">Available via office</span>
                    )}
                    {row.phone && <span className="text-[10px] text-slate-400 block">{row.phone}</span>}
                  </div>
                ),
              },
            ]}
            data={filteredFaculty}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <AdminModal
          isOpen={isModalOpen}
          title={editingId ? 'Edit Faculty Contact' : 'Add Faculty Member'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          isLoading={isSaving}
          submitLabel={editingId ? 'Update & Index' : 'Save & Index'}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name*
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dr. Rajesh Patel"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <Input
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Professor / HOD"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Room / Cabin
                </label>
                <Input
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Room 304"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Name
              </label>
              <Input
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                placeholder="e.g., Computer Science & Engineering"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rajesh.patel@paruluniversity.ac.in"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
