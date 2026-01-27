'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';

export default function DemoBanner() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      // Immediately clear demo data from the store for instant UI update
      const state = useAppStore.getState();
      const demoWorkItemIds = state.workItems
        .filter(w => Array.isArray(w.tags) && w.tags.includes('demo'))
        .map(w => w.id);
      const demoExamIds = state.exams
        .filter(e => Array.isArray(e.tags) && e.tags.includes('demo'))
        .map(e => e.id);
      const demoCourseIds = state.courses
        .filter(c => {
          const hasNonDemoWork = state.workItems.some(w => w.courseId === c.id && !demoWorkItemIds.includes(w.id));
          const hasNonDemoExam = state.exams.some(e => e.courseId === c.id && !demoExamIds.includes(e.id));
          return !hasNonDemoWork && !hasNonDemoExam;
        })
        .map(c => c.id);

      useAppStore.setState((s) => ({
        workItems: s.workItems.filter(w => !demoWorkItemIds.includes(w.id)),
        exams: s.exams.filter(e => !demoExamIds.includes(e.id)),
        courses: s.courses.filter(c => !demoCourseIds.includes(c.id)),
        settings: { ...s.settings, hasDemoData: false },
      }));

      // Fire API call in background
      await fetch('/api/demo-data', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear demo data:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}
    >
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', flex: 1, minWidth: '200px' }}>
        You&apos;re viewing sample data. Clear it and add your own, or connect Canvas to import everything.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleClear}
          disabled={clearing}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--button-secondary)',
            color: 'var(--text)',
            cursor: clearing ? 'not-allowed' : 'pointer',
            opacity: clearing ? 0.6 : 1,
          }}
        >
          {clearing ? 'Clearing...' : 'Clear Sample Data'}
        </button>
        <button
          onClick={() => { localStorage.setItem('settingsTab', 'integrations'); router.push('/settings'); }}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--accent)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          Connect LMS
        </button>
      </div>
    </div>
  );
}
