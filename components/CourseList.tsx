'use client';

import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import { Edit2, Trash2, MapPin, Clock, Link as LinkIcon } from 'lucide-react';

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
            className="first:pt-0 last:pb-0 flex items-start gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors border-b border-[var(--border)] last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-[var(--text)]">{course.code}</h3>
                {course.term && (
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                    {course.term}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {course.name}
              </p>

              {course.meetingTimes && course.meetingTimes.length > 0 && (
                <div className="space-y-1 mb-2">
                  {course.meetingTimes.map((mt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
                    >
                      <Clock size={14} />
                      <span>{mt.day} {mt.start}–{mt.end}</span>
                      <MapPin size={14} />
                      <span>{mt.location}</span>
                    </div>
                  ))}
                </div>
              )}

              {course.links && course.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      <LinkIcon size={14} />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
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
