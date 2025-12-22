'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { X } from 'lucide-react';
import styles from './MobileModal.module.css';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}: MobileModalProps) {
  const isMobile = useIsMobile();

  // On mobile, show as full-screen modal
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div className={styles.backdrop} onClick={onClose} />

        {/* Modal */}
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close modal"
                type="button"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </>
    );
  }

  // On desktop, just render children normally (no wrapper)
  return <>{isOpen && children}</>;
}
