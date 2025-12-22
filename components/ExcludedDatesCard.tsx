'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ExcludedDateForm from '@/components/ExcludedDateForm';
import { Plus, Trash2 } from 'lucide-react';

export default function ExcludedDatesCard() {
  const isMobile = useIsMobile();
  const { excludedDates, courses, settings, deleteExcludedDate } = useAppStore();
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
      // Extract just the date part if it's an ISO datetime string
      const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = dateOnly.split('-').map(Number);
      if (!year || !month || !day) return dateStr;
      const date = new Date(year, month - 1, day);
      const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return formatted === 'Invalid Date' ? dateOnly : formatted;
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
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: isMobile ? '12px' : '20px', gap: isMobile ? '8px' : '0px' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Excluded Dates & Holidays
          </h2>
          <p style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--text-muted)', margin: 0 }}>
            Mark days where you have no classes
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size={isMobile ? 'sm' : 'md'}
          style={{
            backgroundColor: 'var(--button-secondary)',
            color: settings.theme === 'light' ? '#000000' : '#ffffff',
            border: '1px solid var(--border)',
            padding: isMobile ? '6px 12px' : '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '8px',
          }}
        >
          <Plus size={isMobile ? 14 : 16} />
          Add
        </Button>
      </div>

      {showForm && (
        <div style={{ marginBottom: isMobile ? '16px' : '24px', padding: isMobile ? '10px' : '16px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px' }}>
          <ExcludedDateForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {groupedDates.length === 0 ? (
        <EmptyState
          title="No excluded dates"
          description="Add holidays or days with no classes to keep your calendar organized"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
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
                  padding: isMobile ? '8px 10px' : '12px 16px',
                  backgroundColor: 'var(--background-secondary)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '6px' : '0px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '4px' : '12px', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: isMobile ? '2px' : '4px' }}>
                    <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {getCourseName(group.courseId)}
                    </span>
                    <span style={{ fontSize: isMobile ? '10px' : '12px', backgroundColor: 'var(--border)', padding: isMobile ? '1px 6px' : '2px 8px', borderRadius: '4px', color: 'var(--text)' }}>
                      {dateDisplay}
                    </span>
                    {isRange && (
                      <span style={{ fontSize: isMobile ? '9px' : '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        ({group.dates.length} days)
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '500', margin: 0, color: settings.theme === 'light' ? 'var(--text)' : '#e6edf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    padding: isMobile ? '4px' : '8px',
                    color: 'var(--text-muted)',
                    opacity: anyDeleting ? 0.5 : 1,
                    transition: 'color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
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
                  <Trash2 size={isMobile ? 14 : 16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
