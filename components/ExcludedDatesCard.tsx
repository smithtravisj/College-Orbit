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
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return dateStr;
      const date = new Date(year, month - 1, day);
      const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return formatted === 'Invalid Date' ? dateStr : formatted;
    } catch {
      return dateStr;
    }
  };

  const groupedDates = (() => {
    const sorted = [...excludedDates].sort((a, b) => a.date.localeCompare(b.date));
    const groups: Array<{ dates: typeof excludedDates; startDate: string; endDate: string; courseId: string | null; description: string }> = [];

    for (const excludedDate of sorted) {
      // Check if this date should be grouped with the last group
      if (groups.length > 0) {
        const lastGroup = groups[groups.length - 1];
        const lastDate = lastGroup.dates[lastGroup.dates.length - 1];

        // Check if consecutive by comparing dates
        const lastDateParts = lastDate.date.split('-').map(Number);
        const currentDateParts = excludedDate.date.split('-').map(Number);

        const lastDateObj = new Date(lastDateParts[0], lastDateParts[1] - 1, lastDateParts[2]);
        const currentDateObj = new Date(currentDateParts[0], currentDateParts[1] - 1, currentDateParts[2]);

        const daysDiff = Math.round((currentDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

        if (
          daysDiff === 1 &&
          excludedDate.courseId === lastGroup.courseId &&
          excludedDate.description === lastGroup.description
        ) {
          // Add to existing group
          lastGroup.dates.push(excludedDate);
          lastGroup.endDate = excludedDate.date;
          continue;
        }
      }

      // Start a new group
      groups.push({
        dates: [excludedDate],
        startDate: excludedDate.date,
        endDate: excludedDate.date,
        courseId: excludedDate.courseId,
        description: excludedDate.description,
      });
    }

    return groups;
  })();

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

      {groupedDates.length === 0 ? (
        <EmptyState
          title="No excluded dates"
          description="Add holidays or days with no classes to keep your calendar organized"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groupedDates.map((group) => {
            const isRange = group.dates.length > 1;
            const dateDisplay = isRange
              ? `${formatDate(group.startDate)} - ${formatDate(group.endDate)}`
              : formatDate(group.startDate);
            const anyDeleting = group.dates.some(d => isDeleting.has(d.id));

            return (
              <div
                key={group.dates[0].id}
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
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                      {getCourseName(group.courseId)}
                    </span>
                    <span style={{ fontSize: '12px', backgroundColor: 'var(--border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text)' }}>
                      {dateDisplay}
                    </span>
                    {isRange && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        ({group.dates.length} days)
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: 'var(--text)' }}>
                    {group.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Delete all dates in the group
                    group.dates.forEach(date => handleDelete(date.id));
                  }}
                  disabled={anyDeleting}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: anyDeleting ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    color: 'var(--text-muted)',
                    opacity: anyDeleting ? 0.5 : 1,
                    transition: 'color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!anyDeleting) {
                      (e.target as HTMLElement).style.color = '#ef4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!anyDeleting) {
                      (e.target as HTMLElement).style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
