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
  submitVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export default function AdminModal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  submitVariant = 'primary',
  isLoading = false,
}: AdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-slate-800 dark:text-slate-200">{children}</div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800 justify-end">
          <Button variant="outline" onClick={onClose} className="dark:border-slate-700 dark:hover:bg-slate-800">
            Cancel
          </Button>
          {onSubmit && (
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className={
                submitVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs'
                  : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold'
              }
            >
              {isLoading ? (submitVariant === 'danger' ? 'Resetting...' : 'Saving...') : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
