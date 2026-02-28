'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { GpaEntry } from '@/types';
import GradeTrackerTable from './GradeTrackerTable';
import GpaSummaryPanel from './GpaSummaryPanel';
import { Select } from '@/components/ui/Input';

interface GradeTrackerProps {
  courses: Array<{ id: string; name: string; code: string; term?: string; credits?: number | null }>;
  theme?: string;
  onEntriesChange?: () => void;
}

export default function GradeTracker({ courses, theme = 'dark', onEntriesChange }: GradeTrackerProps) {
  const [entries, setEntries] = useState<GpaEntry[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Get unique terms
  const uniqueTerms = Array.from(
    new Set(
      entries
        .filter(e => e.term && e.term.trim() !== '')
        .map(e => e.term!)
    )
  ).sort((a, b) => {
    // Sort chronologically (e.g., "Fall 2024" -> "Spring 2025")
    const seasonOrder = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };
    const [seasonA, yearA] = (a || '').split(' ');
    const [seasonB, yearB] = (b || '').split(' ');

    if (parseInt(yearA || '0') !== parseInt(yearB || '0')) {
      return parseInt(yearA || '0') - parseInt(yearB || '0');
    }
    return (seasonOrder[seasonA as keyof typeof seasonOrder] || 0) -
           (seasonOrder[seasonB as keyof typeof seasonOrder] || 0);
  });

  // Fetch entries and saved semester preference on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch GPA entries
        const entriesRes = await fetch('/api/gpa-entries');
        if (entriesRes.ok) {
          const { entries: fetchedEntries } = await entriesRes.json();
          setEntries(fetchedEntries);
        }

        // Fetch saved semester preference
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const { settings } = await settingsRes.json();
          if (settings?.selectedGradeSemester) {
            setSelectedTerm(settings.selectedGradeSemester);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save semester preference when it changes
  const handleSelectTerm = async (newTerm: string) => {
    setSelectedTerm(newTerm);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedGradeSemester: newTerm }),
      });
    } catch (error) {
      console.error('Error saving semester preference:', error);
    }
  };

  const handleAddGrade = async (newEntry: Omit<GpaEntry, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/gpa-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });

      if (res.ok) {
        const { entry } = await res.json();
        setEntries([...entries, entry]);
        // Notify parent to refresh shared state
        onEntriesChange?.();
      } else {
        throw new Error('Failed to add grade');
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      throw error;
    }
  };

  const handleUpdateGrade = async (id: string, updates: Partial<GpaEntry>) => {
    try {
      const res = await fetch(`/api/gpa-entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const { entry: updatedEntry } = await res.json();
        setEntries(entries.map(e => (e.id === id ? updatedEntry : e)));
        // Notify parent to refresh shared state
        onEntriesChange?.();
      } else {
        throw new Error('Failed to update grade');
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      throw error;
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      const res = await fetch(`/api/gpa-entries/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id));
        // Notify parent to refresh shared state
        onEntriesChange?.();
      } else {
        throw new Error('Failed to delete grade');
      }
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw error;
    }
  };

  const handleSyncFromCourses = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      // Get courseIds already tracked in GPA entries
      const trackedCourseIds = new Set(entries.filter(e => e.courseId).map(e => e.courseId));

      // Filter courses that have a term and aren't already tracked
      const coursesToSync = courses.filter(c => c.term && c.term.trim() && !trackedCourseIds.has(c.id));

      if (coursesToSync.length === 0) {
        setSyncStatus('All courses already tracked');
        setTimeout(() => setSyncStatus(null), 3000);
        return;
      }

      let synced = 0;
      for (const course of coursesToSync) {
        const res = await fetch('/api/gpa-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseName: `${course.code} - ${course.name}`,
            grade: '',
            credits: course.credits || 3,
            courseId: course.id,
            term: course.term,
            status: 'in_progress',
          }),
        });
        if (res.ok) {
          const { entry } = await res.json();
          setEntries(prev => [...prev, entry]);
          synced++;
        }
      }

      setSyncStatus(`Synced ${synced} new course${synced !== 1 ? 's' : ''}`);
      onEntriesChange?.();
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (error) {
      console.error('Error syncing courses:', error);
      setSyncStatus('Error syncing courses');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Filter entries based on selected term (exclude entries without a term - those belong to GPA Calculator)
  const entriesWithTerm = entries.filter(e => e.term && e.term.trim() !== '');
  const filteredEntries = selectedTerm === 'all'
    ? entriesWithTerm
    : entriesWithTerm.filter(e => e.term === selectedTerm);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading grades...</div>;
  }

  return (
    <div>
      {syncing && <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>}
      {/* Semester Selector + Sync Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {uniqueTerms.length > 0 && (
          <div style={{ flex: 1, minWidth: '160px' }}>
            <Select
              value={selectedTerm}
              onChange={(e) => handleSelectTerm(e.target.value)}
              options={[
                { value: 'all', label: 'All Semesters' },
                ...uniqueTerms.map(term => ({ value: term, label: term })),
              ]}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleSyncFromCourses}
          disabled={syncing || courses.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text)',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            cursor: syncing || courses.length === 0 ? 'not-allowed' : 'pointer',
            opacity: syncing || courses.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync from Courses'}
        </button>
        {syncStatus && (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{syncStatus}</span>
        )}
      </div>

      {/* Grades Table */}
      <GradeTrackerTable
        entries={filteredEntries}
        onAddGrade={handleAddGrade}
        onUpdateGrade={handleUpdateGrade}
        onDeleteGrade={handleDeleteGrade}
        courses={courses}
        theme={theme}
      />

      {/* GPA Summary */}
      <GpaSummaryPanel entries={entries} selectedTerm={selectedTerm} />

      {/* Empty State */}
      {entries.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ marginBottom: '12px' }}>No grades tracked yet</p>
          <p style={{ fontSize: '13px' }}>Add your first grade above to start tracking</p>
        </div>
      )}
    </div>
  );
}
