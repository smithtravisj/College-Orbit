'use client';

import useAppStore from '@/lib/store';

interface CourseListProps {
  onEdit: (courseId: string) => void;
}

export default function CourseList({ onEdit }: CourseListProps) {
  const { courses, deleteCourse } = useAppStore();

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{course.code}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {course.name}
              </p>
              {course.term && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {course.term}
                </p>
              )}

              {course.meetingTimes && course.meetingTimes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {course.meetingTimes.map((mt, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      {mt.day} {mt.start}-{mt.end} @ {mt.location}
                    </div>
                  ))}
                </div>
              )}

              {course.links && course.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {course.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline dark:text-blue-400"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(course.id)}
                className="rounded px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                Edit
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
                className="rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
