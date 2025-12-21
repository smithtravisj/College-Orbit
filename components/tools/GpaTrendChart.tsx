'use client';

import { useState, useMemo, useEffect } from 'react';
import { GpaEntry } from '@/types';

interface GpaTrendChartProps {
  entries?: GpaEntry[];
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

export default function GpaTrendChart({ entries: providedEntries }: GpaTrendChartProps) {
  const [entries, setEntries] = useState<GpaEntry[]>(providedEntries || []);
  const [loading, setLoading] = useState(!providedEntries);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use college-specific accent color from color palette
  const accentColor = 'var(--accent)';

  useEffect(() => {
    if (providedEntries) {
      // Use provided entries if available
      setEntries(providedEntries);
      setLoading(false);
      return;
    }

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

  const trendData = useMemo(() => {
    // Get final grades with a term only (GradeTracker entries, excluding GPA Calculator entries)
    const finalGrades = entries.filter(e => e.status === 'final' && e.term && e.term.trim() !== '');

    if (finalGrades.length === 0) return [];

    // Group by term
    const termMap = new Map<string, GpaEntry[]>();
    finalGrades.forEach(entry => {
      const term = entry.term || '';
      if (!termMap.has(term)) {
        termMap.set(term, []);
      }
      termMap.get(term)!.push(entry);
    });

    // Calculate GPA for each term
    const termGPAs = Array.from(termMap.entries()).map(([term, entries]) => {
      let totalPoints = 0;
      let totalCredits = 0;

      entries.forEach(entry => {
        const points = getGradePoints(entry.grade);
        totalPoints += points * entry.credits;
        totalCredits += entry.credits;
      });

      const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0.0;

      return {
        term,
        gpa: Math.round(gpa * 100) / 100,
      };
    });

    // Sort chronologically
    const seasonOrder = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };
    termGPAs.sort((a, b) => {
      const [seasonA, yearA] = a.term.split(' ');
      const [seasonB, yearB] = b.term.split(' ');

      const yearDiff = (parseInt(yearA) || 0) - (parseInt(yearB) || 0);
      if (yearDiff !== 0) return yearDiff;

      return (seasonOrder[seasonA as keyof typeof seasonOrder] || 0) -
             (seasonOrder[seasonB as keyof typeof seasonOrder] || 0);
    });

    return termGPAs;
  }, [entries]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px' }}>Loading...</div>;
  }

  if (trendData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <p>No semester GPA data available</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>
          Complete a semester to see your GPA trend
        </p>
      </div>
    );
  }

  if (trendData.length === 1) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <p>Add more semesters to see trend visualization</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>
          Current GPA: {trendData[0].gpa.toFixed(2)} ({trendData[0].term})
        </p>
      </div>
    );
  }

  // SVG dimensions and scales
  const width = 100;
  const height = 60;
  const padding = { top: 5, right: 5, bottom: 8, left: 5 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (index: number) => {
    return padding.left + (index / (trendData.length - 1)) * chartWidth;
  };

  const yScale = (gpa: number) => {
    return padding.top + chartHeight - (gpa / 4.0) * chartHeight;
  };

  // Build line path
  const linePath = trendData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.gpa)}`)
    .join(' ');

  return (
    <div>
      <svg
        width="100%"
        height="320"
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', marginBottom: '16px' }}
      >
        {/* Grid lines (Y-axis GPA markers: 1.0, 2.0, 3.0, 4.0) */}
        {[1.0, 2.0, 3.0, 4.0].map(gpa => (
          <g key={`grid-${gpa}`}>
            <line
              x1={padding.left}
              y1={yScale(gpa)}
              x2={width - padding.right}
              y2={yScale(gpa)}
              stroke="var(--border)"
              strokeDasharray="2,2"
              strokeWidth="0.3"
            />
            <text
              x={padding.left - 1}
              y={yScale(gpa) + 1}
              fontSize="2"
              fill="var(--text-muted)"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {gpa.toFixed(1)}
            </text>
          </g>
        ))}

        {/* GPA Line */}
        <path
          d={linePath}
          fill="none"
          stroke={accentColor}
          strokeWidth="0.8"
        />

        {/* Data Points */}
        {trendData.map((d, i) => (
          <g key={`point-${i}`}>
            <circle
              cx={xScale(i)}
              cy={yScale(d.gpa)}
              r={hoveredIndex === i ? 1.2 : 0.8}
              fill={accentColor}
              style={{
                cursor: 'pointer',
                transition: 'r 0.2s',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            {/* Term labels */}
            <text
              x={xScale(i)}
              y={height - 1}
              fontSize="2"
              fill="var(--text-muted)"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {d.term.length > 12 ? d.term.substring(0, 9) + '...' : d.term}
            </text>
          </g>
        ))}

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <g>
            <rect
              x={xScale(hoveredIndex) - 8}
              y={yScale(trendData[hoveredIndex].gpa) - 6}
              width="16"
              height="4"
              rx="0.5"
              fill="var(--panel)"
              stroke="var(--border)"
              strokeWidth="0.3"
            />
            <text
              x={xScale(hoveredIndex)}
              y={yScale(trendData[hoveredIndex].gpa) - 4}
              fontSize="2.5"
              fill={accentColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              {trendData[hoveredIndex].gpa.toFixed(2)}
            </text>
          </g>
        )}
      </svg>

      {/* Legend and Info */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Semester GPA Progression ({trendData.length} semesters)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
          }}
        >
          {trendData.map((d, i) => (
            <div
              key={`legend-${i}`}
              style={{
                padding: '8px',
                backgroundColor: 'var(--panel)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {d.term}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: accentColor,
                  marginTop: '4px',
                }}
              >
                {d.gpa.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
