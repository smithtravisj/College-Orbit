'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Edit2, Trash2 } from 'lucide-react';
import { Course } from '@/types';

interface CourseListProps {
  courses: Course[];
  onEdit: (courseId: string) => void;
  showSemester?: boolean;
}

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const isPM = hours >= 12;
  const hours12 = hours % 12 || 12;
  const ampm = isPM ? 'PM' : 'AM';
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export default function CourseList({ courses, onEdit, showSemester = false }: CourseListProps) {
  const { deleteCourse } = useAppStore();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    courseId: string;
    courseName: string;
  }>({
    isOpen: false,
    courseId: '',
    courseName: '',
  });

  if (courses.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="h-full">
      <div className="space-y-4 divide-y divide-[var(--border)]">
        {courses.map((course) => (
          <div
            key={course.id}
            style={{ paddingTop: '10px', paddingBottom: '10px' }}
            className="first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors border-b border-[var(--border)] last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">
                  {course.code}{course.name ? ` - ${course.name}` : ''}
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

                {course.links && course.links.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {course.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(course.id)}
                className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                title="Edit course"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmation({
                    isOpen: true,
                    courseId: course.id,
                    courseName: course.code,
                  });
                }}
                className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                title="Delete course"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Course"
        message={`Delete ${deleteConfirmation.courseName}? This will not delete associated tasks and deadlines.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          deleteCourse(deleteConfirmation.courseId);
          setDeleteConfirmation({
            isOpen: false,
            courseId: '',
            courseName: '',
          });
        }}
        onCancel={() => {
          setDeleteConfirmation({
            isOpen: false,
            courseId: '',
            courseName: '',
          });
        }}
      />
    </>
  );
}
