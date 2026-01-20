'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import ConfirmationModal from '@/components/ConfirmationModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import { Edit2, Trash2, Check, FileIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Course } from '@/types';
import { CanvasBadge } from './CanvasBadge';

interface CourseListProps {
  courses: Course[];
  onEdit: (courseId: string) => void;
  showSemester?: boolean;
  // Bulk selection props
  isSelecting?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onLongPressStart?: (id: string) => void;
  onLongPressEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
}

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const isPM = hours >= 12;
  const hours12 = hours % 12 || 12;
  const ampm = isPM ? 'PM' : 'AM';
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export default function CourseList({
  courses,
  onEdit,
  showSemester = false,
  isSelecting = false,
  selectedIds = new Set(),
  onToggleSelection,
  onLongPressStart,
  onLongPressEnd,
  onContextMenu,
}: CourseListProps) {
  const isMobile = useIsMobile();
  const { deleteCourse } = useAppStore();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    courseId: string;
    courseName: string;
    isCanvasCourse: boolean;
  }>({
    isOpen: false,
    courseId: '',
    courseName: '',
    isCanvasCourse: false,
  });
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);

  if (courses.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
      <div className="space-y-4 divide-y divide-[var(--border)]">
        {courses.map((course) => {
          const isSelected = selectedIds.has(course.id);
          return (
          <div
            key={course.id}
            style={{
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '32px',
              paddingRight: '32px',
              transition: 'background-color 0.2s ease',
              backgroundColor: isSelected ? 'var(--nav-active)' : undefined,
            }}
            className="first:pt-0 last:pb-0 flex items-center gap-4 group/course hover:bg-[var(--panel-2)] rounded transition-colors border-b border-[var(--border)] last:border-b-0"
            onContextMenu={(e) => onContextMenu?.(e, course.id)}
            onTouchStart={() => onLongPressStart?.(course.id)}
            onTouchEnd={onLongPressEnd}
            onTouchCancel={onLongPressEnd}
            onClick={() => {
              if (isSelecting) {
                onToggleSelection?.(course.id);
              }
            }}
          >
            {/* Selection checkbox - appears when in selection mode */}
            {isSelecting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection?.(course.id);
                }}
                style={{
                  width: isMobile ? '20px' : '24px',
                  height: isMobile ? '20px' : '24px',
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {isSelected && <Check size={isMobile ? 12 : 14} color="white" />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{course.code}{course.name ? ` - ${course.name}` : ''}</span>
                  {course.canvasCourseId && <CanvasBadge />}
                </h3>
              </div>
              {showSemester && course.term && (
                <div className="text-xs text-[var(--text-muted)]" style={{ marginTop: '6px' }}>
                  {course.term}
                </div>
              )}
              <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
                {course.meetingTimes && course.meetingTimes.length > 0 && (
                  <div className="flex flex-col gap-0.5 text-xs text-[var(--text-muted)]">
                    {course.meetingTimes.map((mt, idx) => (
                      <span key={idx}>{mt.days.join(', ')} {formatTime12Hour(mt.start)} – {formatTime12Hour(mt.end)}{mt.location && ` at ${mt.location}`}</span>
                    ))}
                  </div>
                )}

                {((course.links && course.links.length > 0) || (course.files && course.files.length > 0)) && (
                  <div className="flex flex-col" style={{ gap: '0px' }}>
                    {course.links && course.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--link)] hover:text-blue-400 transition-colors"
                        style={{ width: 'fit-content' }}
                      >
                        {link.label}
                      </a>
                    ))}
                    {course.files && course.files.map((file: { name: string; url: string; size: number }, fileIndex: number) => (
                      <button
                        key={`${fileIndex}-${file.name}`}
                        type="button"
                        style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--link)', width: 'fit-content', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
                        className="hover:text-blue-400"
                        onClick={(e) => { e.stopPropagation(); setPreviewingFile({ file, allFiles: course.files || [], index: fileIndex }); }}
                      >
                        <FileIcon size={12} style={{ flexShrink: 0 }} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover/course:opacity-100 transition-opacity flex-shrink-0" style={{ gap: isMobile ? '8px' : '6px' }}>
              {!isMobile && (
                <button
                  onClick={() => onEdit(course.id)}
                  className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                  style={{ padding: '8px' }}
                  title="Edit course"
                >
                  <Edit2 size={20} />
                </button>
              )}
              <button
                onClick={() => {
                  setDeleteConfirmation({
                    isOpen: true,
                    courseId: course.id,
                    courseName: course.code,
                    isCanvasCourse: !!course.canvasCourseId,
                  });
                }}
                className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                style={{ padding: isMobile ? '6px' : '8px' }}
                title="Delete course"
              >
                <Trash2 size={isMobile ? 18 : 20} />
              </button>
            </div>
          </div>
        );
        })}
      </div>
    </Card>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.isCanvasCourse ? "Delete Canvas Course" : "Delete Course"}
        message={deleteConfirmation.isCanvasCourse
          ? `Delete ${deleteConfirmation.courseName}? This course is synced from Canvas and will not reappear on future syncs. Associated tasks and deadlines will not be deleted.`
          : `Delete ${deleteConfirmation.courseName}? This will not delete associated tasks and deadlines.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          deleteCourse(deleteConfirmation.courseId);
          setDeleteConfirmation({
            isOpen: false,
            courseId: '',
            courseName: '',
            isCanvasCourse: false,
          });
        }}
        onCancel={() => {
          setDeleteConfirmation({
            isOpen: false,
            courseId: '',
            courseName: '',
            isCanvasCourse: false,
          });
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewingFile?.file ?? null}
        files={previewingFile?.allFiles}
        currentIndex={previewingFile?.index ?? 0}
        onClose={() => setPreviewingFile(null)}
        onNavigate={(file, index) => setPreviewingFile(prev => prev ? { ...prev, file, index } : null)}
      />
    </>
  );
}
