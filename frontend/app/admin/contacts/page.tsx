'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contactApi } from '@/lib/adminApi';

export default function ContactsAdminPage() {
  const [contacts, setContacts] = useState(contactApi.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const handleOpenModal = (contact?: any) => {
    if (contact) {
      setEditingName(contact.name);
      setFormData(contact);
    } else {
      setEditingName(null);
      setFormData({ name: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingName) {
      contactApi.update(editingName, formData);
    } else {
      contactApi.create(formData);
    }
    setContacts(contactApi.getAll());
    setIsModalOpen(false);
  };

  const handleDelete = (contact: any) => {
    if (confirm(`Delete contact "${contact.name}"?`)) {
      contactApi.delete(contact.name);
      setContacts(contactApi.getAll());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Contacts Management</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus size={20} />
            Add Contact
          </Button>
        </div>

        <AdminTable
          columns={[
            { key: 'name', label: 'Department/Office' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
          ]}
          data={contacts}
          onEdit={() => {}}
          onDelete={handleDelete}
        />

        <AdminModal
          isOpen={isModalOpen}
          title={editingName ? 'Edit Contact' : 'Add Contact'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department/Office Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Admissions Office"
                disabled={!!editingName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@university.edu"
              />
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
