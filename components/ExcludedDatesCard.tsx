'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ExcludedDateForm from '@/components/ExcludedDateForm';
import { Plus, Trash2 } from 'lucide-react';

export default function ExcludedDatesCard() {
  const { excludedDates, courses, deleteExcludedDate } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    setIsDeleting((prev) => new Set(prev).add(id));
    try {
      await deleteExcludedDate(id);
    } catch (error) {
      console.error('Error deleting excluded date:', error);
    } finally {
      setIsDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return 'All Courses';
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Unknown Course';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const sortedDates = [...excludedDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Excluded Dates & Holidays
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Mark days where you have no classes
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: '#122343',
            color: '#ffffff',
            border: '1px solid #202d48',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          Add
        </Button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px' }}>
          <ExcludedDateForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {sortedDates.length === 0 ? (
        <EmptyState
          title="No excluded dates"
          description="Add holidays or days with no classes to keep your calendar organized"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedDates.map((excludedDate) => (
            <div
              key={excludedDate.id}
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {getCourseName(excludedDate.courseId)}
                  </span>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    {formatDate(excludedDate.date)}
                  </span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: 'var(--text)' }}>
                  {excludedDate.description}
                </p>
              </div>
              <button
                onClick={() => handleDelete(excludedDate.id)}
                disabled={isDeleting.has(excludedDate.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isDeleting.has(excludedDate.id) ? 'not-allowed' : 'pointer',
                  padding: '8px',
                  color: 'var(--text-muted)',
                  opacity: isDeleting.has(excludedDate.id) ? 0.5 : 1,
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting.has(excludedDate.id)) {
                    (e.target as HTMLElement).style.color = '#ef4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting.has(excludedDate.id)) {
                    (e.target as HTMLElement).style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
