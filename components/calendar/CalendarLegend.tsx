'use client';

import { getMonthViewColor } from '@/lib/calendarUtils';

export default function CalendarLegend() {
  const legendItems = [
    { color: getMonthViewColor({ type: 'course' } as any), label: 'Course' },
    { color: getMonthViewColor({ type: 'exam' } as any), label: 'Exam' },
    { color: getMonthViewColor({ type: 'event' } as any), label: 'Event' },
    { color: getMonthViewColor({ type: 'task' } as any), label: 'Task' },
    { color: getMonthViewColor({ type: 'deadline' } as any), label: 'Deadline' },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {legendItems.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: item.color,
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
