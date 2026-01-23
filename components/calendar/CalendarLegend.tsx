'use client';

import { getMonthViewColor } from '@/lib/calendarUtils';
import useAppStore from '@/lib/store';

export default function CalendarLegend() {
  const settings = useAppStore((state) => state.settings);
  const colorblindMode = settings.colorblindMode as any;
  const colorblindStyle = settings.colorblindStyle as any;
  const theme = (settings.theme || 'dark') as 'light' | 'dark';

  const legendItems = [
    { color: getMonthViewColor({ type: 'course' } as any, colorblindMode, theme, colorblindStyle), label: 'Course' },
    { color: getMonthViewColor({ type: 'exam' } as any, colorblindMode, theme, colorblindStyle), label: 'Exam' },
    { color: getMonthViewColor({ type: 'task' } as any, colorblindMode, theme, colorblindStyle), label: 'Task' },
    { color: getMonthViewColor({ type: 'deadline' } as any, colorblindMode, theme, colorblindStyle), label: 'Assignment' },
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
      {/* Event with rainbow indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: 'conic-gradient(#ff0000 0deg 30deg, #ff8000 30deg 60deg, #ffff00 60deg 90deg, #60cc00 90deg 120deg, #00bb00 120deg 150deg, #00bb60 150deg 180deg, #00cccc 180deg 210deg, #0080ff 210deg 240deg, #0000ff 240deg 270deg, #8000ff 270deg 300deg, #ff00ff 300deg 330deg, #ff0080 330deg 360deg)',
          }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Event
        </span>
      </div>
    </div>
  );
}
