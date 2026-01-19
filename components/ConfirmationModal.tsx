'use client';

import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">{title}</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={onCancel}
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? 'danger' : 'primary'}
              size="md"
              type="button"
              onClick={onConfirm}
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
