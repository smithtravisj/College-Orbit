'use client';

import { ChevronDown } from 'lucide-react';
import Input from '@/components/ui/Input';
import { Course, StatusFilter, QuickFilter } from './types';

interface DeckSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  courses: Course[];
  selectedCourses: Set<string>;
  onCourseToggle: (courseId: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  showCoursesDropdown: boolean;
  setShowCoursesDropdown: (show: boolean) => void;
  isMobile?: boolean;
}

export default function DeckSidebar({
  searchQuery,
  onSearchChange,
  courses,
  selectedCourses,
  onCourseToggle,
  statusFilter,
  onStatusFilterChange,
  quickFilter,
  onQuickFilterChange,
  showCoursesDropdown,
  setShowCoursesDropdown,
  isMobile = false,
}: DeckSidebarProps) {
  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All decks' },
    { value: 'due', label: 'Has cards due' },
    { value: 'needs-review', label: 'Needs review (<50%)' },
    { value: 'almost-mastered', label: 'Almost mastered (>80%)' },
  ];

  const quickFilters: { value: QuickFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'due-today', label: 'Due Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'mastered', label: 'Mastered' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '14px' }}>
      {/* Search */}
      <div>
        <Input
          label="Search decks"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or description"
        />
      </div>

      {/* Quick filters */}
      <div>
        <div style={{
          fontSize: isMobile ? '11px' : '14px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '8px',
          padding: isMobile ? '0 8px' : '0',
        }}>
          Quick Filters
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onQuickFilterChange(filter.value)}
              style={{
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '11px' : '13px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: quickFilter === filter.value ? 'var(--accent)' : 'var(--panel-2)',
                color: quickFilter === filter.value ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div>
        <div style={{
          fontSize: isMobile ? '11px' : '14px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '8px',
          padding: isMobile ? '0 8px' : '0',
        }}>
          Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {statusFilters.map((filter) => (
            <label
              key={filter.value}
              onClick={() => onStatusFilterChange(filter.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '8px',
                fontSize: isMobile ? '11px' : '14px',
                cursor: 'pointer',
                padding: isMobile ? '4px 6px' : '8px',
                borderRadius: '6px',
                transition: 'background-color 150ms ease, color 150ms ease',
                color: statusFilter === filter.value ? 'var(--text)' : 'var(--text-muted)',
                backgroundColor: statusFilter === filter.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = statusFilter === filter.value ? 'rgba(255,255,255,0.05)' : 'transparent';
                e.currentTarget.style.color = statusFilter === filter.value ? 'var(--text)' : 'var(--text-muted)';
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {filter.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Course filter */}
      {courses.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCoursesDropdown(!showCoursesDropdown)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '4px 8px' : '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: '600', color: 'var(--text)' }}>
              Courses
            </span>
            <ChevronDown
              size={isMobile ? 12 : 16}
              style={{
                transform: showCoursesDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
                color: 'var(--text)',
              }}
            />
          </button>
          {showCoursesDropdown && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '0px' }}>
              {courses.map((course) => (
                <label
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '8px',
                    fontSize: isMobile ? '11px' : '14px',
                    cursor: 'pointer',
                    padding: isMobile ? '4px 6px' : '8px',
                    borderRadius: '6px',
                    transition: 'background-color 150ms ease, color 150ms ease',
                    color: 'var(--text-muted)',
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.has(course.id)}
                    onChange={() => onCourseToggle(course.id)}
                    style={{ borderRadius: '4px', flexShrink: 0 }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {course.code}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
