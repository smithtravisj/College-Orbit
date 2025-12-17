'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import CourseForm from '@/components/CourseForm';
import CourseList from '@/components/CourseList';

export default function CoursesPage() {
  const [mounted, setMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { courses, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Courses</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Course
          </button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <h3 className="mb-4 text-lg font-semibold">Add Course</h3>
          <CourseForm
            onClose={() => setIsAdding(false)}
          />
        </div>
      )}

      {editingId && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <h3 className="mb-4 text-lg font-semibold">Edit Course</h3>
          <CourseForm
            courseId={editingId}
            onClose={() => setEditingId(null)}
          />
        </div>
      )}

      <CourseList onEdit={setEditingId} />

      {courses.length === 0 && !isAdding && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            No courses yet. Add one to get started!
          </p>
        </div>
      )}
    </div>
  );
}
