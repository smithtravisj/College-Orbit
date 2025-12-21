'use client';

import { useMemo } from 'react';
import { GpaEntry } from '@/types';

interface GpaSummaryPanelProps {
  entries: GpaEntry[];
  selectedTerm: string;
}

const gradePoints: { [key: string]: number } = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};

const getGradePoints = (grade: string): number => {
  // Check if it's a percentage
  const percentage = parseFloat(grade);
  if (!isNaN(percentage) && grade.includes('.')) {
    // It's a percentage-like number
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    return 0.0;
  }
  // Try as letter grade
  if (gradePoints[grade] !== undefined) {
    return gradePoints[grade];
  }
  // Try to parse as percentage without decimal
  const percentInt = parseInt(grade);
  if (!isNaN(percentInt) && percentInt >= 0 && percentInt <= 100) {
    if (percentInt >= 93) return 4.0;
    if (percentInt >= 90) return 3.7;
    if (percentInt >= 87) return 3.3;
    if (percentInt >= 83) return 3.0;
    if (percentInt >= 80) return 2.7;
    if (percentInt >= 77) return 2.3;
    if (percentInt >= 73) return 2.0;
    if (percentInt >= 70) return 1.7;
    if (percentInt >= 67) return 1.3;
    if (percentInt >= 63) return 1.0;
    return 0.0;
  }
  return 0;
};

export default function GpaSummaryPanel({ entries, selectedTerm }: GpaSummaryPanelProps) {
  const { semesterGPA, cumulativeGPA, totalCredits } = useMemo(() => {
    // Calculate semester GPA (filtered by term)
    let semesterPoints = 0;
    let semesterCredits = 0;

    if (selectedTerm !== 'all') {
      entries
        .filter(e => e.term === selectedTerm)
        .forEach(entry => {
          const points = getGradePoints(entry.grade);
          semesterPoints += points * entry.credits;
          semesterCredits += entry.credits;
        });
    }

    const semesterGPA = semesterCredits > 0 ? semesterPoints / semesterCredits : 0.0;

    // Calculate cumulative GPA (only final grades)
    let cumulativePoints = 0;
    let cumulativeCredits = 0;

    entries
      .filter(e => e.status === 'final')
      .forEach(entry => {
        const points = getGradePoints(entry.grade);
        cumulativePoints += points * entry.credits;
        cumulativeCredits += entry.credits;
      });

    const cumulativeGPA = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0.0;
    const totalCredits = cumulativeCredits;

    return {
      semesterGPA: Math.round(semesterGPA * 100) / 100,
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      totalCredits,
    };
  }, [entries, selectedTerm]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: selectedTerm !== 'all' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: '16px',
        marginTop: '20px',
      }}
    >
      {selectedTerm !== 'all' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Semester GPA
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
            {semesterGPA.toFixed(2)}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Cumulative GPA
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>
          {cumulativeGPA.toFixed(2)}
        </div>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Total Credits
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>
          {totalCredits}
        </div>
      </div>
    </div>
  );
}
