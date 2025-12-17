'use client';

import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Edit2, Trash2, MapPin, Clock, Link as LinkIcon } from 'lucide-react';

interface CourseListProps {
  onEdit: (courseId: string) => void;
}

export default function CourseList({ onEdit }: CourseListProps) {
  const { courses, deleteCourse } = useAppStore();

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--grid-gap)]">
      {courses.map((course) => (
        <Card key={course.id} hoverable>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[var(--text)]">{course.code}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {course.name}
              </p>
              {course.term && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {course.term}
                </p>
              )}

              {course.meetingTimes && course.meetingTimes.length > 0 && (
                <div className="mt-3 space-y-3">
                  {course.meetingTimes.map((mt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
                    >
                      <Clock size={16} />
                      <span>{mt.day} {mt.start}–{mt.end}</span>
                      <MapPin size={16} className="ml-2" />
                      <span>{mt.location}</span>
                    </div>
                  ))}
                </div>
              )}

              {course.links && course.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {course.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      <LinkIcon size={16} />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 opacity-100 lg:opacity-0 lg:hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(course.id)}
                title="Edit course"
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${course.code}? This will not delete associated tasks and deadlines.`
                    )
                  ) {
                    deleteCourse(course.id);
                  }
                }}
                title="Delete course"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
