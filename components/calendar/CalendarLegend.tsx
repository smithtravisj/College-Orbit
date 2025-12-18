'use client';

import { COLORBLIND_PALETTE } from '@/lib/calendarUtils';

export default function CalendarLegend() {
  const legendItems = [
    { color: COLORBLIND_PALETTE.blue, label: 'Course' },
    { color: COLORBLIND_PALETTE.yellow, label: 'Task' },
    { color: COLORBLIND_PALETTE.orange, label: 'Deadline (upcoming)' },
    { color: COLORBLIND_PALETTE.red, label: 'Deadline (overdue)' },
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
