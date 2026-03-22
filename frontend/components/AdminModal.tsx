'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function AdminModal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
}: AdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onSubmit && (
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
