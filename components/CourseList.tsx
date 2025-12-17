'use client';

import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  meetingTimes?: Array<{
    day: string;
    start: string;
    end: string;
    location: string;
  }>;
  links?: Array<{
    label: string;
    url: string;
  }>;
}

interface CourseListProps {
  courses: Course[];
  onEdit: (courseId: string) => void;
}

export default function CourseList({ courses, onEdit }: CourseListProps) {
  const { deleteCourse } = useAppStore();

  if (courses.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <div className="space-y-4 divide-y divide-[var(--border)]">
        {courses.map((course) => (
          <div
            key={course.id}
            style={{ paddingTop: '10px', paddingBottom: '10px' }}
            className="first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors border-b border-[var(--border)] last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[var(--text)]">{course.code}</h3>
                {course.term && (
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                    {course.term}
                  </span>
                )}
              </div>
              {course.name && (
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {course.name}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {course.meetingTimes && course.meetingTimes.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    {course.meetingTimes.map((mt, idx) => (
                      <span key={idx}>{mt.days?.join(', ') || mt.day} {mt.start}–{mt.end}</span>
                    ))}
                  </div>
                )}

                {course.links && course.links.length > 0 && (
                  <>
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
                  </>
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
                  if (
                    confirm(
                      `Delete ${course.code}? This will not delete associated tasks and deadlines.`
                    )
                  ) {
                    deleteCourse(course.id);
                  }
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
  );
}
