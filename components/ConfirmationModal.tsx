'use client';

import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import { useAnimatedOpen } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';

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
  const { visible, closing } = useAnimatedOpen(isOpen);
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 9999 }}
      onClick={onCancel}
    >
      <div
        className={`${previewStyles.modal} ${previewStyles.modalNarrow} ${closing ? previewStyles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px' }}>
          <h2 className={previewStyles.title} style={{ marginBottom: '8px' }}>{title}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{message}</p>
        </div>
        <div className={previewStyles.footer}>
          <Button variant="secondary" style={{ flex: 1 }} type="button" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={isDangerous ? 'danger' : 'primary'} style={{ flex: 1 }} type="button" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
