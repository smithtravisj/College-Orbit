'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { useAnimatedOpen } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const { visible, closing } = useAnimatedOpen(isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const modKey = isMac ? '⌘' : 'Ctrl';

  const formatKeys = (keys: string[]) => {
    return keys.map(k => k === '⌘' ? modKey : k === '⌫' ? (isMac ? '⌫' : 'Backspace') : k);
  };

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 100000 }}
      onClick={onClose}
    >
      <div
        className={`${previewStyles.modal} ${closing ? previewStyles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={previewStyles.header}>
          <h2 className={previewStyles.title}>Keyboard Shortcuts</h2>
          <button onClick={onClose} className={previewStyles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className={previewStyles.content}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            overscrollBehavior: 'contain',
          }}
        >
          {Object.entries(KEYBOARD_SHORTCUTS).map(([key, section]) => (
            <div key={key}>
              <h3
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}
              >
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                      {shortcut.description}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {formatKeys(shortcut.keys).map((k, j) => (
                        <span key={j}>
                          <kbd
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              fontFamily: 'inherit',
                              backgroundColor: 'var(--panel-2)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              color: 'var(--text)',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {k}
                          </kbd>
                          {j < formatKeys(shortcut.keys).length - 1 && shortcut.keys[0] !== 'G' && (
                            <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Press <kbd style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              marginLeft: '4px',
              marginRight: '4px',
            }}>?</kbd> anywhere to show this help
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
