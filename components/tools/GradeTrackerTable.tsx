'use client';

import { useState } from 'react';
import { GpaEntry } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import Input, { Select } from '@/components/ui/Input';

interface GradeTrackerTableProps {
  entries: GpaEntry[];
  onAddGrade: (entry: Omit<GpaEntry, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateGrade: (id: string, updates: Partial<GpaEntry>) => Promise<void>;
  onDeleteGrade: (id: string) => Promise<void>;
  courses: Array<{ id: string; name: string; term?: string }>;
  theme?: string;
}

const gradeOptions = [
  { value: 'A', label: 'A' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'B-', label: 'B-' },
  { value: 'C+', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'C-', label: 'C-' },
  { value: 'D+', label: 'D+' },
  { value: 'D', label: 'D' },
  { value: 'F', label: 'F' },
];

const statusOptions = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'final', label: 'Final' },
];

export default function GradeTrackerTable({
  entries,
  onAddGrade,
  onUpdateGrade,
  onDeleteGrade,
  courses,
  theme = 'dark',
}: GradeTrackerTableProps) {
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [newGrade, setNewGrade] = useState<Omit<GpaEntry, 'id' | 'createdAt'>>({
    courseName: '',
    grade: 'A',
    credits: 3,
    term: '',
    status: 'in_progress',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddGrade = async () => {
    if (!newGrade.courseName || !newGrade.grade) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await onAddGrade(newGrade);
      setNewGrade({
        courseName: '',
        grade: 'A',
        credits: 3,
        term: '',
        status: 'in_progress',
      });
      setIsAddingGrade(false);
    } catch (error) {
      console.error('Error adding grade:', error);
      alert('Failed to add grade');
    }
  };

  const handleCourseSelect = (courseName: string) => {
    const selectedCourse = courses.find(c => c.name === courseName);
    setNewGrade({
      ...newGrade,
      courseName,
      term: selectedCourse?.term || '',
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Course
          </div>
        </div>
        <div style={{ minWidth: '120px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Term
          </div>
        </div>
        <div style={{ minWidth: '100px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Grade
          </div>
        </div>
        <div style={{ minWidth: '90px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Credits
          </div>
        </div>
        <div style={{ minWidth: '110px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Status
          </div>
        </div>
        <div style={{ width: '34px' }}></div>
      </div>

      {/* Grade Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {entries.map(entry => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: 'var(--panel-2)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                {entry.courseName}
              </div>
            </div>
            <div style={{ minWidth: '120px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {entry.term || '—'}
            </div>
            <div style={{ minWidth: '100px' }}>
              {editingId === entry.id ? (
                <Select
                  value={entry.grade}
                  onChange={(e) =>
                    onUpdateGrade(entry.id, { grade: e.target.value })
                  }
                  options={gradeOptions}
                />
              ) : (
                <div
                  onClick={() => setEditingId(entry.id)}
                  style={{
                    fontSize: '14px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--panel)',
                  }}
                >
                  {entry.grade}
                </div>
              )}
            </div>
            <div style={{ minWidth: '90px' }}>
              {editingId === entry.id ? (
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={entry.credits.toString()}
                  onChange={(e) =>
                    onUpdateGrade(entry.id, { credits: parseFloat(e.target.value) })
                  }
                  style={{ padding: '6px 8px' }}
                />
              ) : (
                <div
                  onClick={() => setEditingId(entry.id)}
                  style={{
                    fontSize: '14px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--panel)',
                  }}
                >
                  {entry.credits}
                </div>
              )}
            </div>
            <div style={{ minWidth: '110px' }}>
              {editingId === entry.id ? (
                <Select
                  value={entry.status || 'final'}
                  onChange={(e) =>
                    onUpdateGrade(entry.id, { status: e.target.value as 'in_progress' | 'final' })
                  }
                  options={statusOptions}
                />
              ) : (
                <div
                  onClick={() => setEditingId(entry.id)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      entry.status === 'in_progress'
                        ? 'var(--panel-2)'
                        : 'var(--panel)',
                    color:
                      entry.status === 'in_progress'
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {entry.status === 'in_progress' ? 'In Progress' : 'Final'}
                </div>
              )}
            </div>
            <button
              onClick={() => setDeleteConfirmId(entry.id)}
              style={{
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Delete grade"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Grade */}
      {!isAddingGrade ? (
        <button
          onClick={() => setIsAddingGrade(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'var(--panel-2)',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--panel)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--panel-2)';
          }}
        >
          <Plus size={18} />
          Add Grade
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            padding: '12px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <Select
              value={newGrade.courseName}
              onChange={(e) => handleCourseSelect(e.target.value)}
              options={[
                { value: '', label: 'Select a course...' },
                ...courses.map(c => ({ value: c.name, label: c.name })),
              ]}
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                color: newGrade.term ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              {newGrade.term || '—'}
            </div>
          </div>
          <div style={{ minWidth: '100px' }}>
            <Select
              value={newGrade.grade}
              onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
              options={gradeOptions}
            />
          </div>
          <div style={{ minWidth: '90px' }}>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={newGrade.credits.toString()}
              onChange={(e) => setNewGrade({ ...newGrade, credits: parseFloat(e.target.value) })}
              placeholder="Credits"
            />
          </div>
          <div style={{ minWidth: '110px' }}>
            <Select
              value={newGrade.status}
              onChange={(e) => setNewGrade({ ...newGrade, status: e.target.value as 'in_progress' | 'final' })}
              options={statusOptions}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddGrade}
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingGrade(false)}
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--panel)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
                Delete Grade
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Are you sure you want to delete this grade? This action cannot be undone.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--panel-2)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteGrade(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme === 'light' ? 'var(--danger)' : '#c52a2a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
