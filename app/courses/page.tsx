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
  const [termFilter, setTermFilter] = useState('all');
  const [showEnded, setShowEnded] = useState(false);
  const { courses, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    // Load showEnded from localStorage
    const saved = localStorage.getItem('showEndedCourses');
    if (saved) {
      setShowEnded(JSON.parse(saved));
    }
    setMounted(true);
  }, [initializeStore]);

  // Save showEnded to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('showEndedCourses', JSON.stringify(showEnded));
    }
  }, [showEnded, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  // Filter out courses that have ended
  const isCourseCurrent = (course: any) => {
    if (!course.endDate) return true;
    const endDate = new Date(course.endDate);
    endDate.setHours(23, 59, 59, 999);
    return endDate >= new Date();
  };

  // Get unique terms for filter (based on showEnded setting)
  const coursesToShow = showEnded ? courses : courses.filter(isCourseCurrent);
  const uniqueTerms = Array.from(new Set(coursesToShow.map((c) => c.term).filter(Boolean)));
  const filteredCourses = (termFilter === 'all' ? coursesToShow : coursesToShow.filter((c) => c.term === termFilter));

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage your classes"
        actions={
          !isAdding && !editingId && (
            <Button variant="secondary" size="md" onClick={() => setIsAdding(true)}>
              <Plus size={18} />
              New Course
            </Button>
          )
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: '24px' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]">
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
            <Card>
              <h3 className="text-sm font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>Filters</h3>
              <div className="space-y-2" style={{ marginBottom: '16px' }}>
                {[
                  { value: 'all', label: 'All Courses' },
                  ...uniqueTerms.map((term) => ({ value: term, label: term })),
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTermFilter(f.value)}
                    className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                      termFilter === f.value
                        ? 'bg-[var(--accent-2)] text-[var(--text)]'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                    }`}
                    style={{ padding: '12px 16px' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '12px 16px' }}>
                  <input
                    type="checkbox"
                    checked={showEnded}
                    onChange={(e) => setShowEnded(e.target.checked)}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border)',
                      borderRadius: '3px',
                      backgroundColor: showEnded ? '#132343' : 'transparent',
                      cursor: 'pointer',
                      backgroundImage: showEnded ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                      backgroundSize: '100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <span className="text-sm font-medium text-[var(--text)]">Show ended courses</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Courses list - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Add Course Form */}
            {isAdding && (
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <h3 className="text-xl font-semibold text-[var(--text)]" style={{ marginBottom: '20px' }}>Add Course</h3>
                <CourseForm onClose={() => setIsAdding(false)} />
              </Card>
            </div>
          )}

            {/* Edit Course Form */}
            {editingId && (
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <h3 className="text-xl font-semibold text-[var(--text)]" style={{ marginBottom: '20px' }}>Edit Course</h3>
                <CourseForm courseId={editingId} onClose={() => setEditingId(null)} />
              </Card>
            </div>
          )}

            {/* Courses List */}
            {filteredCourses.length > 0 ? (
              <CourseList courses={filteredCourses} onEdit={setEditingId} showSemester={termFilter === 'all'} />
            ) : (
              <EmptyState
                title={termFilter === 'all' ? 'No courses yet' : 'No courses in this term'}
                description={termFilter === 'all' ? 'Add your first course to get started' : 'Try selecting a different term'}
                action={
                  termFilter !== 'all'
                    ? { label: 'View all courses', onClick: () => setTermFilter('all') }
                    : { label: 'Add Course', onClick: () => setIsAdding(true) }
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
