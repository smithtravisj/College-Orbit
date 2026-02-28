'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ExcludedDate, Course } from '@/types';
import { getEventColor } from '@/lib/calendarUtils';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';
import { useAnimatedOpen } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';

interface ExclusionDetailModalProps {
  isOpen: boolean;
  exclusion: ExcludedDate | null;
  courses: Course[];
  onClose: () => void;
}

export default function ExclusionDetailModal({
  isOpen,
  exclusion,
  courses,
  onClose,
}: ExclusionDetailModalProps) {
  const settings = useAppStore((state) => state.settings);
  const colorblindMode = settings.colorblindMode as any;
  const colorblindStyle = settings.colorblindStyle as any;
  const theme = (settings.theme || 'dark') as 'light' | 'dark';
  const { visible, closing } = useAnimatedOpen(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!visible || !exclusion) return null;
  if (typeof document === 'undefined') return null;

  const isHoliday = !exclusion.courseId;
  const course = exclusion.courseId ? courses.find((c) => c.id === exclusion.courseId) : null;
  const markerColor = getEventColor({ courseId: exclusion.courseId } as any, colorblindMode, theme, colorblindStyle);

  const formatDate = (dateStr: string) => {
    try {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`${previewStyles.modal} ${previewStyles.modalNarrow} ${closing ? previewStyles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={previewStyles.header}>
          <div className={previewStyles.headerInfo}>
            <h2 className={previewStyles.title}>{exclusion.description || (isHoliday ? 'Holiday' : 'Class Cancelled')}</h2>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  backgroundColor: `${markerColor}80`,
                  color: 'var(--calendar-event-text)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {isHoliday ? 'No School' : 'Class Cancelled'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={previewStyles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={previewStyles.content} style={{ overscrollBehavior: 'contain' }}>
          <div className={previewStyles.section}>
            <div className={previewStyles.sectionLabel}>Date</div>
            <div className={previewStyles.sectionValue}>{formatDate(exclusion.date)}</div>
          </div>

          {course && (
            <div className={previewStyles.section}>
              <div className={previewStyles.sectionLabel}>Course</div>
              <div className={previewStyles.sectionValue}>
                {course.code ? `${course.code} - ${course.name}` : course.name}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={previewStyles.footer}>
          <Button variant="primary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
