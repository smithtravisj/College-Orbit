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

        // Check if consecutive by comparing dates (handle both YYYY-MM-DD and ISO datetime)
        const lastDateOnly = lastDate.date.includes('T') ? lastDate.date.split('T')[0] : lastDate.date;
        const currentDateOnly = excludedDate.date.includes('T') ? excludedDate.date.split('T')[0] : excludedDate.date;
        const lastDateParts = lastDateOnly.split('-').map(Number);
        const currentDateParts = currentDateOnly.split('-').map(Number);

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

      <ExcludedDateForm isOpen={showForm} onClose={() => setShowForm(false)} />

      {groupedDates.length === 0 ? (
        <EmptyState
          title="No excluded dates"
          description="Add holidays or days with no classes to keep your calendar organized"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '2px', maxHeight: isMobile ? '200px' : '260px', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {groupedDates.map((group) => {
            const isRange = group.dates.length > 1;
            const dateDisplay = isRange
              ? `${formatDate(group.startDate)} – ${formatDate(group.endDate)}`
              : formatDate(group.startDate);
            const anyDeleting = group.dates.some(d => isDeleting.has(d.id));

            return (
              <div
                key={group.dates[0].id}
                style={{
                  padding: isMobile ? '6px 8px' : '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 150ms ease',
                }}
                className="hover:bg-[var(--panel-2)]"
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500, color: settings.theme === 'light' ? 'var(--text)' : '#e6edf6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.description}
                  </span>
                  <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {dateDisplay}{isRange ? ` (${group.dates.length}d)` : ''}
                  </span>
                  {group.courseId && (
                    <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      · {courses.find(c => c.id === group.courseId)?.code || 'Unknown'}
                    </span>
                  )}
                </div>
                <button
                  className="icon-btn"
                  onClick={() => {
                    group.dates.forEach(date => handleDelete(date.id));
                  }}
                  disabled={anyDeleting}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: anyDeleting ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    color: 'var(--text-muted)',
                    opacity: anyDeleting ? 0.5 : 0.4,
                    transition: 'all 150ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!anyDeleting) {
                      (e.target as HTMLElement).style.color = '#ef4444';
                      (e.target as HTMLElement).style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!anyDeleting) {
                      (e.target as HTMLElement).style.color = 'var(--text-muted)';
                      (e.target as HTMLElement).style.opacity = '0.4';
                    }
                  }}
                >
                  <Trash2 size={isMobile ? 13 : 14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
