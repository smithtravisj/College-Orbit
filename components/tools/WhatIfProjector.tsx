'use client';

import { useState, useMemo, useEffect } from 'react';
import { GpaEntry } from '@/types';
import { Select } from '@/components/ui/Input';

interface WhatIfProjectorProps {
  entries?: GpaEntry[];
  theme?: string;
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

const getGradePoints = (grade: string): number => {
  const percentage = parseFloat(grade);
  if (!isNaN(percentage) && grade.includes('.')) {
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
  if (gradePoints[grade] !== undefined) {
    return gradePoints[grade];
  }
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

export default function WhatIfProjector({ entries: providedEntries, theme = 'dark' }: WhatIfProjectorProps) {
  const [entries, setEntries] = useState<GpaEntry[]>(providedEntries || []);
  const [loading, setLoading] = useState(!providedEntries);

  useEffect(() => {
    if (providedEntries) return; // Use provided entries if available

    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/gpa-entries');
        if (res.ok) {
          const { entries: fetchedEntries } = await res.json();
          setEntries(fetchedEntries);
        }
      } catch (error) {
        console.error('Error fetching GPA entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [providedEntries]);

  const inProgressGrades = entries.filter(e => e.status === 'in_progress');
  const [hypotheticalGrades, setHypotheticalGrades] = useState<Record<string, string>>(
    inProgressGrades.reduce((acc, entry) => {
      acc[entry.id] = entry.grade;
      return acc;
    }, {} as Record<string, string>)
  );
  const [isProjecting, setIsProjecting] = useState(false);

  const { originalCumulativeGPA, projectedCumulativeGPA, delta, deltaPercentage } = useMemo(() => {
    if (!isProjecting || inProgressGrades.length === 0) {
      return {
        originalCumulativeGPA: 0,
        projectedCumulativeGPA: 0,
        delta: 0,
        deltaPercentage: false,
      };
    }

    // Calculate original cumulative GPA (only final grades)
    let originalPoints = 0;
    let originalCredits = 0;

    entries
      .filter(e => e.status === 'final')
      .forEach(entry => {
        const points = getGradePoints(entry.grade);
        originalPoints += points * entry.credits;
        originalCredits += entry.credits;
      });

    const originalCumulativeGPA = originalCredits > 0 ? originalPoints / originalCredits : 0.0;

    // Calculate projected cumulative GPA (final grades + hypothetical in-progress grades)
    let projectedPoints = originalPoints;
    let projectedCredits = originalCredits;

    inProgressGrades.forEach(entry => {
      const hypotheticalGrade = hypotheticalGrades[entry.id] || entry.grade;
      const points = getGradePoints(hypotheticalGrade);
      projectedPoints += points * entry.credits;
      projectedCredits += entry.credits;
    });

    const projectedCumulativeGPA = projectedCredits > 0 ? projectedPoints / projectedCredits : 0.0;

    const delta = projectedCumulativeGPA - originalCumulativeGPA;
    const deltaPercentage = delta >= 0;

    return {
      originalCumulativeGPA: Math.round(originalCumulativeGPA * 100) / 100,
      projectedCumulativeGPA: Math.round(projectedCumulativeGPA * 100) / 100,
      delta: Math.round(Math.abs(delta) * 100) / 100,
      deltaPercentage,
    };
  }, [isProjecting, entries, hypotheticalGrades, inProgressGrades]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  if (inProgressGrades.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
        <p>No in-progress grades to project</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>
          Mark your current semester grades as "In Progress" to use what-if scenarios
        </p>
      </div>
    );
  }

  return (
    <div>
      {!isProjecting ? (
        <button
          onClick={() => setIsProjecting(true)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'var(--accent)',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Project Future Grades
        </button>
      ) : (
        <div>
          {/* Hypothetical Grades Editor */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Adjust your expected grades to see the impact on your GPA
              </div>
              {inProgressGrades.map(entry => (
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
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                      {entry.courseName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Current: {entry.grade} | {entry.credits} credits
                    </div>
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <Select
                      value={hypotheticalGrades[entry.id] || entry.grade}
                      onChange={(e) =>
                        setHypotheticalGrades({
                          ...hypotheticalGrades,
                          [entry.id]: e.target.value,
                        })
                      }
                      options={gradeOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projection Result */}
          <div
            style={{
              padding: '16px',
              backgroundColor: deltaPercentage ? 'var(--accent-bg)' : 'var(--panel)',
              border: `1px solid ${deltaPercentage ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Projected Cumulative GPA
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: deltaPercentage ? (theme === 'light' ? '#2563eb' : '#7fa8ff') : 'var(--text)', marginBottom: '8px' }}>
              {projectedCumulativeGPA.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: deltaPercentage ? (theme === 'light' ? '#2563eb' : '#7fa8ff') : 'var(--text-muted)',
              }}
            >
              {deltaPercentage ? '+' : '-'}{delta.toFixed(2)} from current ({originalCumulativeGPA.toFixed(2)})
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsProjecting(false)}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'var(--panel-2)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Done
            </button>
            <button
              onClick={() => {
                setHypotheticalGrades(
                  inProgressGrades.reduce((acc, entry) => {
                    acc[entry.id] = entry.grade;
                    return acc;
                  }, {} as Record<string, string>)
                );
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'var(--panel-2)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
