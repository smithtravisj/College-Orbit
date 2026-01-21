'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExcludedDate, Course } from '@/types';
import { getEventColor } from '@/lib/calendarUtils';

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
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !exclusion) return null;
  if (typeof document === 'undefined') return null;

  const isHoliday = !exclusion.courseId;
  const course = exclusion.courseId
    ? courses.find((c) => c.id === exclusion.courseId)
    : null;
  const markerColor = getEventColor({ courseId: exclusion.courseId } as any);

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      // Parse YYYY-MM-DD format manually to avoid timezone issues
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        // Create date using local timezone by specifying components
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      // Fallback for other formats
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '0',
          minWidth: '320px',
          maxWidth: '450px',
          width: '90%',
          zIndex: 10000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Type badge */}
          <div
            style={{
              backgroundColor: `${markerColor}80`,
              color: 'var(--calendar-event-text)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {isHoliday ? 'No School' : 'Class Cancelled'}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Date */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Date
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {formatDate(exclusion.date)}
            </div>
          </div>

          {/* Course (if class cancelled) */}
          {course && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Course
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                {course.code ? `${course.code} - ${course.name}` : course.name}
              </div>
            </div>
          )}

          {/* Description / Reason */}
          {exclusion.description && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {isHoliday ? 'Reason' : 'Notes'}
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                }}
              >
                {exclusion.description}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent)',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
              color: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
