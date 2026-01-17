'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import CourseForm from '@/components/CourseForm';
import CourseList from '@/components/CourseList';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import BulkEditToolbar, { BulkAction } from '@/components/BulkEditToolbar';
import {
  BulkChangeTermModal,
  BulkAddLinkModal,
  BulkDeleteModal,
} from '@/components/BulkActionModals';

export default function CoursesPage() {
  const isMobile = useIsMobile();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const colorPalette = getCollegeColorPalette(university || null, theme);
  const [mounted, setMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState('all');
  const [termFilterInitialized, setTermFilterInitialized] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state
  const bulkSelect = useBulkSelect();
  const [bulkModal, setBulkModal] = useState<BulkAction | null>(null);

  const { courses, settings, initializeStore, updateSettings, updateCourse, bulkUpdateCourses, bulkDeleteCourses } = useAppStore();

  const handleTermFilterChange = (newFilter: string) => {
    setTermFilter(newFilter);
    updateSettings({ courseTermFilter: newFilter });
  };

  useEffect(() => {
    initializeStore();
    // Load showEnded from localStorage
    const saved = localStorage.getItem('showEndedCourses');
    if (saved) {
      setShowEnded(JSON.parse(saved));
    }
    setMounted(true);
  }, [initializeStore]);

  // Sync termFilter from settings on initial load only
  useEffect(() => {
    if (mounted && !termFilterInitialized && settings.courseTermFilter) {
      setTermFilter(settings.courseTermFilter);
      setTermFilterInitialized(true);
    }
  }, [mounted, termFilterInitialized, settings.courseTermFilter]);

  // Save showEnded to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('showEndedCourses', JSON.stringify(showEnded));
    }
  }, [showEnded, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const getDateSearchStrings = (dateString: string | null | undefined): string[] => {
    if (!dateString) return [];

    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    return [
      `${month}/${day}`,
      `${month}/${day}/${year}`,
      `${month}-${day}`,
      `${month}-${day}-${year}`,
      `${day}/${month}/${year}`,
      monthNames[date.getMonth()],
      monthShort[date.getMonth()],
      `${monthNames[date.getMonth()]} ${day}`,
      `${monthShort[date.getMonth()]} ${day}`,
      `${day} ${monthNames[date.getMonth()]}`,
      `${day} ${monthShort[date.getMonth()]}`,
      String(date.getDate()),
      String(year),
    ];
  };

  const getTimeSearchStrings = (timeString: string): string[] => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hours12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'pm' : 'am';

    return [
      // 24-hour format with minutes
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      `${hours}:${String(minutes).padStart(2, '0')}`,
      // 12-hour format with minutes
      `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`,
      `${hours12}:${String(minutes).padStart(2, '0')}${ampm}`,
      `${hours12}:${minutes} ${ampm}`,
      `${hours12}:${minutes}${ampm}`,
      // 12-hour format without minutes
      `${hours12} ${ampm}`,
      `${hours12}${ampm}`,
      // Individual components
      String(hours),
      String(hours12),
      String(minutes),
    ];
  };

  const getDayVariations = (day: string): string[] => {
    const dayLower = day.toLowerCase();
    const dayAbbreviations: { [key: string]: string } = {
      'monday': 'mon',
      'tuesday': 'tue',
      'wednesday': 'wed',
      'thursday': 'thu',
      'friday': 'fri',
      'saturday': 'sat',
      'sunday': 'sun',
    };

    const variations = [dayLower];

    // Add abbreviation if full name is provided
    if (dayAbbreviations[dayLower]) {
      variations.push(dayAbbreviations[dayLower]);
    }

    // Add full name if abbreviation is provided
    Object.entries(dayAbbreviations).forEach(([full, abbr]) => {
      if (dayLower === abbr) {
        variations.push(full);
      }
    });

    return variations;
  };


  // Get unique terms for filter
  const uniqueTerms = Array.from(new Set(courses.map((c) => c.term).filter(Boolean)));

  // Bulk action handlers
  const handleBulkAction = (action: BulkAction) => {
    setBulkModal(action);
  };

  const handleBulkTermChange = async (term: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkUpdateCourses(ids, { term: term || undefined });
  };

  const handleBulkAddLink = async (link: { label: string; url: string }) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const course = courses.find(c => c.id === id);
      if (course) {
        const newLinks = [...(course.links || []), link];
        await updateCourse(id, { links: newLinks });
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkDeleteCourses(ids);
    bulkSelect.clearSelection();
  };

  // Filter by term
  let filteredCourses = termFilter === 'all' ? courses : courses.filter((c) => c.term === termFilter);

  // Apply end date filter only when showing all courses
  if (termFilter === 'all' && !showEnded) {
    filteredCourses = filteredCourses.filter((course) => {
      if (!course.endDate) return true; // Show courses with no end date

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const endStr = course.endDate.split('T')[0]; // Handle both timestamp and date string formats

      return endStr >= dateStr; // Show courses that haven't ended (endDate is today or later)
    });
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredCourses = filteredCourses.filter((course) => {
      const startDateSearchStrings = getDateSearchStrings(course.startDate);
      const endDateSearchStrings = getDateSearchStrings(course.endDate);
      const meetingTimesSearchStrings = course.meetingTimes
        .flatMap((mt) => [
          ...mt.days.flatMap((day) => getDayVariations(day)),
          ...getTimeSearchStrings(mt.start),
          ...getTimeSearchStrings(mt.end),
          ...(mt.location ? [mt.location.toLowerCase()] : []),
        ]);

      return (
        course.code.toLowerCase().includes(query) ||
        course.name.toLowerCase().includes(query) ||
        course.term.toLowerCase().includes(query) ||
        course.links.some((link) => link.label.toLowerCase().includes(query) || link.url.toLowerCase().includes(query)) ||
        startDateSearchStrings.some((dateStr) => dateStr.includes(query)) ||
        endDateSearchStrings.some((dateStr) => dateStr.includes(query)) ||
        meetingTimesSearchStrings.some((str) => str.includes(query))
      );
    });
  }

  return (
    <>
      {/* Courses Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Subtle glow behind title */}
              <div style={{ position: 'absolute', inset: '-20px -30px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colorPalette.accent}18 0%, transparent 70%)`,
                  }}
                />
              </div>
              <h1
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: isMobile ? '26px' : '34px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                }}
              >
                Courses
              </h1>
            </div>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
              Your classes and schedules.
            </p>
          </div>
          {!isMobile && !isAdding && !editingId && (
            <Button variant="secondary" size="md" style={{ marginTop: '8px' }} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsAdding(true); }}>
              <Plus size={18} />
              New Course
            </Button>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ position: 'relative', zIndex: 1 }}>
          {/* Filters sidebar - 3 columns (desktop only) */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', display: isMobile ? 'none' : 'block', position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <Card noAccent>
              <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: '14px' }}>Filters</h3>
              <div style={{ marginBottom: '14px' }}>
                <Input
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                />
              </div>
              <div className="space-y-1" style={{ marginBottom: '14px' }}>
                {[
                  { value: 'all', label: 'All Courses' },
                  ...uniqueTerms.map((term) => ({ value: term, label: term })),
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleTermFilterChange(f.value)}
                    className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                      termFilter === f.value
                        ? 'text-[var(--text)]'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                    }`}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: termFilter === f.value ? 'var(--nav-active)' : 'transparent',
                      backgroundImage: termFilter === f.value ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                      boxShadow: termFilter === f.value ? `0 0 10px ${colorPalette.accent}80` : 'none',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <label className="flex items-center gap-4 cursor-pointer" style={{ padding: '8px 14px' }}>
                  <input
                    type="checkbox"
                    checked={showEnded}
                    onChange={(e) => setShowEnded(e.target.checked)}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border)',
                      borderRadius: '3px',
                      backgroundColor: showEnded ? 'var(--button-secondary)' : 'transparent',
                      cursor: 'pointer',
                      backgroundImage: showEnded ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                      backgroundSize: '100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <span className="text-sm font-medium text-[var(--text)]">Show Finished Courses</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Mobile collapsible filters */}
          {isMobile && (
            <div className="col-span-12" style={{ marginBottom: isMobile ? '8px' : '0px' }}>
              <CollapsibleCard
                id="courses-filters"
                title="Filters"
              >
                <div style={{ marginBottom: isMobile ? '8px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                  />
                </div>
                <div className="space-y-2" style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                  {[
                    { value: 'all', label: 'All Courses' },
                    ...uniqueTerms.map((term) => ({ value: term, label: term })),
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => handleTermFilterChange(f.value)}
                      className={`w-full text-left rounded-[var(--radius-control)] font-medium transition-colors ${
                        termFilter === f.value
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                      }`}
                      style={{
                        padding: isMobile ? '8px 12px' : '12px 16px',
                        fontSize: isMobile ? '13px' : '14px',
                        backgroundColor: termFilter === f.value ? 'var(--nav-active)' : 'transparent',
                        backgroundImage: termFilter === f.value ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                        boxShadow: termFilter === f.value ? `0 0 10px ${colorPalette.accent}80` : 'none',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ paddingTop: isMobile ? '6px' : '8px', borderTop: '1px solid var(--border)' }}>
                  <label className="flex items-center gap-4 cursor-pointer" style={{ padding: isMobile ? '6px 0' : '8px 16px' }}>
                    <input
                      type="checkbox"
                      checked={showEnded}
                      onChange={(e) => setShowEnded(e.target.checked)}
                      style={{
                        appearance: 'none',
                        width: isMobile ? '14px' : '16px',
                        height: isMobile ? '14px' : '16px',
                        border: '2px solid var(--border)',
                        borderRadius: '3px',
                        backgroundColor: showEnded ? 'var(--button-secondary)' : 'transparent',
                        cursor: 'pointer',
                        backgroundImage: showEnded ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <span className="font-medium text-[var(--text)]" style={{ fontSize: isMobile ? '12px' : '14px' }}>Show Finished Courses</span>
                  </label>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* Courses list - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6" style={{ height: 'fit-content' }}>
            {/* Add Course Form - desktop only */}
            {!isMobile && isAdding && (
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <h3 className="text-xl font-semibold text-[var(--text)]" style={{ marginBottom: '20px' }}>Add Course</h3>
                <CourseForm onClose={() => setIsAdding(false)} />
              </Card>
            </div>
          )}

            {/* Edit Course Form - desktop only */}
            {!isMobile && editingId && (
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <h3 className="text-xl font-semibold text-[var(--text)]" style={{ marginBottom: '20px' }}>Edit Course</h3>
                <CourseForm courseId={editingId} onClose={() => setEditingId(null)} />
              </Card>
            </div>
          )}

            {/* Courses List */}
            {filteredCourses.length > 0 ? (
              <CourseList
                courses={filteredCourses}
                onEdit={(courseId) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setEditingId(courseId); }}
                showSemester={termFilter === 'all'}
                isSelecting={bulkSelect.isSelecting}
                selectedIds={bulkSelect.selectedIds}
                onToggleSelection={bulkSelect.toggleSelection}
                onLongPressStart={bulkSelect.handleLongPressStart}
                onLongPressEnd={bulkSelect.handleLongPressEnd}
                onContextMenu={bulkSelect.handleContextMenu}
              />
            ) : (
              <EmptyState
                title={termFilter === 'all' ? 'No courses yet' : 'No courses in this term'}
                description={termFilter === 'all' ? 'Add your first course to get started' : 'Try selecting a different term'}
                action={
                  termFilter !== 'all'
                    ? { label: 'View all courses', onClick: () => handleTermFilterChange('all') }
                    : { label: 'Add Course', onClick: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsAdding(true); } }
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Bulk Edit Toolbar */}
      {bulkSelect.isSelecting && bulkSelect.selectedIds.size > 0 && (
        <BulkEditToolbar
          selectedCount={bulkSelect.selectedIds.size}
          entityType="course"
          onAction={handleBulkAction}
          onCancel={bulkSelect.clearSelection}
          onSelectAll={() => bulkSelect.selectAll(filteredCourses.map(c => c.id))}
        />
      )}

      {/* Bulk Action Modals */}
      <BulkChangeTermModal
        isOpen={bulkModal === 'term'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        allTerms={uniqueTerms as string[]}
        onConfirm={handleBulkTermChange}
      />
      <BulkAddLinkModal
        isOpen={bulkModal === 'link'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        onConfirm={handleBulkAddLink}
      />
      <BulkDeleteModal
        isOpen={bulkModal === 'delete'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        entityType="course"
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
