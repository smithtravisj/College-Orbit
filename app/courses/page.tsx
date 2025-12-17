'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import CourseForm from '@/components/CourseForm';
import CourseList from '@/components/CourseList';
import { Plus } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage your classes"
        actions={
          !isAdding && !editingId && (
            <Button variant="primary" size="md" onClick={() => setIsAdding(true)}>
              <Plus size={18} />
              New Course
            </Button>
          )
        }
      />
      <div className="mx-auto max-w-[var(--container)] px-8 py-8 space-y-7">
          {isAdding && (
            <Card title="Add Course" padding="lg">
              <div className="mt-2">
                <CourseForm onClose={() => setIsAdding(false)} />
              </div>
            </Card>
          )}

          {editingId && (
            <Card title="Edit Course" padding="lg">
              <div className="mt-2">
                <CourseForm courseId={editingId} onClose={() => setEditingId(null)} />
              </div>
            </Card>
          )}

          <CourseList onEdit={setEditingId} />

          {courses.length === 0 && !isAdding && !editingId && (
            <EmptyState
              title="No courses yet"
              description="Add your first course to get started"
              action={{ label: 'Add Course', onClick: () => setIsAdding(true) }}
            />
          )}
      </div>
    </>
  );
}
