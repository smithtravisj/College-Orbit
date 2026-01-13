'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2, MapPin, Check } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import TagInput from '@/components/notes/TagInput';
import BulkEditToolbar, { BulkAction } from '@/components/BulkEditToolbar';
import {
  BulkChangeCourseModal,
  BulkChangeTagsModal,
  BulkChangeDateModal,
  BulkChangeTimeModal,
  BulkAddLinkModal,
  BulkChangeLocationModal,
  BulkDeleteModal,
} from '@/components/BulkActionModals';

export default function ExamsPage() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingExams] = useState<Set<string>>(new Set());
  const [toggledExams] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    examDate: '',
    examTime: '',
    location: '',
    notes: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
  });
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState('');

  // Bulk selection state
  const bulkSelect = useBulkSelect();
  const [bulkModal, setBulkModal] = useState<BulkAction | null>(null);

  const { courses, exams, settings, addExam, updateExam, deleteExam, bulkUpdateExams, bulkDeleteExams, initializeStore } = useAppStore();

  // Handle filters card collapse state changes and save to database
  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== 'exams-filters')  // Remove from array when opening
      : [...currentCollapsed, 'exams-filters'];  // Add to array when closing

    // Update store immediately for local UI sync
    useAppStore.setState((state) => ({
      settings: {
        ...state.settings,
        dashboardCardsCollapsedState: newCollapsed,
      },
    }));

    // Save to database
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardCardsCollapsedState: newCollapsed }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            console.error('[Exams] Save failed:', err);
          });
        }
        return res.json();
      })
      .catch(err => console.error('[Exams] Failed to save filters collapse state:', err));
  };

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Exam title is required');
      return;
    }

    if (!formData.examDate.trim()) {
      setFormError('Exam date is required');
      return;
    }

    console.log('[Exams] Form submission started');
    console.log('[Exams] Form data:', JSON.stringify(formData, null, 2));

    let examAt: string | null = null;
    // examAt is required for exams
    if (formData.examDate && formData.examDate.trim()) {
      try {
        // If date is provided but time is not, default to 9:00 AM for exams
        const dateTimeString = formData.examTime ? `${formData.examDate}T${formData.examTime}` : `${formData.examDate}T09:00`;
        console.log('[Exams] Date time string:', dateTimeString);
        const dateObj = new Date(dateTimeString);
        console.log('[Exams] Parsed date:', dateObj.toISOString(), 'getTime():', dateObj.getTime());
        // Verify it's a valid date and not the epoch
        if (dateObj.getTime() > 0) {
          examAt = dateObj.toISOString();
          console.log('[Exams] Valid examAt set to:', examAt);
        } else {
          console.log('[Exams] Date getTime() <= 0, rejecting');
          setFormError('Please enter a valid exam date');
          return;
        }
      } catch (err) {
        // If date parsing fails, leave examAt as null
        console.error('[Exams] Date parsing error:', err);
        setFormError('Invalid date or time format');
        return;
      }
    } else {
      console.log('[Exams] No date provided, examAt will be null');
      formData.examTime = '';
      setFormError('Exam date is required');
      return;
    }

    if (!examAt) {
      console.error('[Exams] examAt is required');
      setFormError('Exam date is required');
      return;
    }

    console.log('[Exams] Final examAt before API call:', examAt);

    // Handle links - normalize and add https:// if needed
    const links = formData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http://') || l.url.startsWith('https://')
          ? l.url
          : `https://${l.url}`
      }));

    const payload = {
      title: formData.title,
      courseId: formData.courseId || null,
      examAt,
      location: formData.location || null,
      notes: formData.notes,
      tags: formData.tags,
      links,
      status: 'scheduled' as const,
    };

    console.log('[Exams] Payload being sent:', JSON.stringify(payload, null, 2));

    if (editingId) {
      console.log('[Exams] Updating exam:', editingId);
      await updateExam(editingId, {
        title: formData.title,
        courseId: formData.courseId || null,
        examAt,
        location: formData.location || null,
        notes: formData.notes,
        tags: formData.tags,
        links,
      });
      setEditingId(null);
    } else {
      console.log('[Exams] Creating new exam');
      await addExam(payload);
    }

    setFormData({ title: '', courseId: '', examDate: '', examTime: '', location: '', notes: '', tags: [], links: [{ label: '', url: '' }] });
    setShowForm(false);
  };

  const startEdit = (exam: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(exam.id);
    const examDateTime = exam.examAt ? new Date(exam.examAt) : null;
    let dateStr = '';
    let timeStr = '';
    if (examDateTime) {
      const year = examDateTime.getFullYear();
      const month = String(examDateTime.getMonth() + 1).padStart(2, '0');
      const date = String(examDateTime.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${date}`;
      timeStr = `${String(examDateTime.getHours()).padStart(2, '0')}:${String(examDateTime.getMinutes()).padStart(2, '0')}`;
    }
    setFormData({
      title: exam.title,
      courseId: exam.courseId || '',
      examDate: dateStr,
      examTime: timeStr,
      location: exam.location || '',
      notes: exam.notes,
      tags: exam.tags || [],
      links: exam.links && exam.links.length > 0 ? exam.links : [{ label: '', url: '' }],
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', courseId: '', examDate: '', examTime: '', location: '', notes: '', tags: [], links: [{ label: '', url: '' }] });
    setShowForm(false);
  };

  const getDateSearchStrings = (examAt: string | null | undefined): string[] => {
    if (!examAt) return [];

    const date = new Date(examAt);
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

  const getTimeSearchStrings = (examAt: string | null | undefined): string[] => {
    if (!examAt) return [];

    const date = new Date(examAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
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

  // Collect all unique tags from exams
  const allTags = Array.from(new Set(exams.flatMap((e) => e.tags || [])));

  // Bulk action handlers
  const handleBulkAction = (action: BulkAction) => {
    setBulkModal(action);
  };

  const handleBulkCourseChange = async (courseId: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkUpdateExams(ids, { courseId });
  };

  const handleBulkTagsChange = async (tags: string[], mode: 'add' | 'replace') => {
    const ids = Array.from(bulkSelect.selectedIds);
    if (mode === 'replace') {
      await bulkUpdateExams(ids, { tags });
    } else {
      for (const id of ids) {
        const exam = exams.find(e => e.id === id);
        if (exam) {
          const newTags = Array.from(new Set([...(exam.tags || []), ...tags]));
          await updateExam(id, { tags: newTags });
        }
      }
    }
  };

  const handleBulkDateChange = async (date: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const exam = exams.find(e => e.id === id);
      if (exam) {
        let examAt: string | undefined = undefined;
        if (date) {
          const existingTime = exam.examAt ? new Date(exam.examAt).toTimeString().slice(0, 5) : '09:00';
          examAt = new Date(`${date}T${existingTime}`).toISOString();
        }
        await updateExam(id, { examAt });
      }
    }
  };

  const handleBulkTimeChange = async (time: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const exam = exams.find(e => e.id === id);
      if (exam && exam.examAt) {
        const existingDate = new Date(exam.examAt).toISOString().split('T')[0];
        const examAt = time ? new Date(`${existingDate}T${time}`).toISOString() : exam.examAt;
        await updateExam(id, { examAt });
      }
    }
  };

  const handleBulkLocationChange = async (location: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkUpdateExams(ids, { location });
  };

  const handleBulkAddLink = async (link: { label: string; url: string }) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const exam = exams.find(e => e.id === id);
      if (exam) {
        const newLinks = [...(exam.links || []), link];
        await updateExam(id, { links: newLinks });
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkDeleteExams(ids);
    bulkSelect.clearSelection();
  };

  const now = new Date();
  const filtered = exams
    .filter((exam) => {
      // Always include toggled exams (keep them visible after status change)
      if (toggledExams.has(exam.id)) {
        return true;
      }

      const examTime = new Date(exam.examAt);
      if (filter === 'upcoming') return examTime > now && exam.status === 'scheduled';
      if (filter === 'past') return examTime <= now || exam.status !== 'scheduled';
      return true; // 'all'
    })
    .filter((exam) => {
      // Filter by course if a course is selected
      if (courseFilter && exam.courseId !== courseFilter) return false;
      return true;
    })
    .filter((exam) => {
      // Filter by selected tags
      if (selectedTags.size > 0 && !exam.tags?.some((tag) => selectedTags.has(tag))) return false;
      return true;
    })
    .filter((exam) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === exam.courseId);
      const dateSearchStrings = getDateSearchStrings(exam.examAt);
      const timeSearchStrings = getTimeSearchStrings(exam.examAt);

      return (
        exam.title.toLowerCase().includes(query) ||
        exam.notes.toLowerCase().includes(query) ||
        (exam.location && exam.location.toLowerCase().includes(query)) ||
        (course && course.code.toLowerCase().includes(query)) ||
        exam.links.some((link) => link.label.toLowerCase().includes(query) || link.url.toLowerCase().includes(query)) ||
        dateSearchStrings.some((dateStr) => dateStr.includes(query)) ||
        timeSearchStrings.some((timeStr) => timeStr.includes(query))
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.examAt).getTime();
      const bTime = new Date(b.examAt).getTime();

      // For upcoming exams: ascending (soonest first)
      if (filter === 'upcoming') {
        return aTime - bTime;
      }
      // For past exams: descending (most recent first)
      return bTime - aTime;
    });

  return (
    <>
      <PageHeader
        title="Exams"
        subtitle="Schedule and track your exams"
        actions={
          <Button variant="secondary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            Schedule Exam
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ gap: isMobile ? '16px' : undefined, overflow: 'visible' }}>
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: isMobile ? undefined : '107px', alignSelf: 'start' }}>
            {isMobile ? (
              <CollapsibleCard
                id="exams-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('exams-filters')}
                onChange={handleFiltersCollapseChange}
              >
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exams..."
                  />
                </div>
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Select
                    label="Course"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'past', label: 'Past' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                        filter === f.value
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                      }`}
                      style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {allTags.length > 0 && (
                  <div style={{ marginTop: isMobile ? '12px' : '20px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Tags</label>
                    <div className="space-y-1">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={(e) => {
                              const newTags = new Set(selectedTags);
                              if (e.target.checked) {
                                newTags.add(tag);
                              } else {
                                newTags.delete(tag);
                              }
                              setSelectedTags(newTags);
                            }}
                            className="rounded border-[var(--border)]"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleCard>
            ) : (
              <Card>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: isMobile ? '10px' : '16px' }}>Filters</h3>
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exams..."
                  />
                </div>
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Select
                    label="Course"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'past', label: 'Past' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                        filter === f.value
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                      }`}
                      style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {allTags.length > 0 && (
                  <div style={{ marginTop: isMobile ? '12px' : '20px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Tags</label>
                    <div className="space-y-1">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={(e) => {
                              const newTags = new Set(selectedTags);
                              if (e.target.checked) {
                                newTags.add(tag);
                              } else {
                                newTags.delete(tag);
                              }
                              setSelectedTags(newTags);
                            }}
                            className="rounded border-[var(--border)]"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Exams list - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>

            {/* Add Exam Form */}
            {showForm && (
            <div style={{ overflow: 'visible' }}>
              <Card>
                <form onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-3'} style={{ overflow: 'visible' }}>
                {formError && (
                  <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', padding: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'rgb(239, 68, 68)', margin: 0 }}>{formError}</p>
                  </div>
                )}
                <div style={{ paddingBottom: isMobile ? '0px' : '4px' }}>
                  <Input
                    label="Exam title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Calculus Midterm"
                    required
                  />
                </div>

                {/* Course and Location row */}
                <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'} style={{ overflow: 'visible', paddingTop: isMobile ? '4px' : '8px' }}>
                  <Select
                    label="Course"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                  {!isMobile && (
                    <>
                      <CalendarPicker
                        label="Exam Date"
                        value={formData.examDate}
                        onChange={(date) => setFormData({ ...formData, examDate: date })}
                      />
                      <TimePicker
                        label="Exam Time"
                        value={formData.examTime}
                        onChange={(time) => setFormData({ ...formData, examTime: time })}
                      />
                    </>
                  )}
                </div>

                {/* Date and Time row - mobile only */}
                {isMobile && (
                  <div className="grid grid-cols-2 gap-2" style={{ overflow: 'visible', paddingTop: '8px' }}>
                    <CalendarPicker
                      label="Exam Date"
                      value={formData.examDate}
                      onChange={(date) => setFormData({ ...formData, examDate: date })}
                    />
                    <TimePicker
                      label="Exam Time"
                      value={formData.examTime}
                      onChange={(time) => setFormData({ ...formData, examTime: time })}
                    />
                  </div>
                )}

                {/* Notes and Tags */}
                <div className="flex flex-col gap-2" style={{ paddingTop: isMobile ? '4px' : '8px' }}>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add study tips, topics to review, etc."
                    style={isMobile ? { minHeight: '52px', height: '52px', padding: '8px 10px' } : { minHeight: '60px', height: '60px' }}
                  />
                  <div style={{ marginTop: isMobile ? '-8px' : '-4px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: isMobile ? '4px' : '6px' }}>Tags</label>
                    <TagInput
                      tags={formData.tags}
                      onTagsChange={(tags) => setFormData({ ...formData, tags })}
                      allAvailableTags={allTags}
                      placeholder="Add tags..."
                    />
                  </div>
                </div>

                {/* Links */}
                <div style={{ marginTop: isMobile ? '8px' : '10px' }}>
                  <label className="block font-semibold text-[var(--text)]" style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: isMobile ? '4px' : '8px' }}>Links</label>
                  <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                    {formData.links.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                        <Input
                          label={idx === 0 ? 'Label' : ''}
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const newLinks = [...formData.links];
                            newLinks[idx].label = e.target.value;
                            setFormData({ ...formData, links: newLinks });
                          }}
                          placeholder="e.g., Study Guide"
                          className="w-32"
                          labelClassName={isMobile ? 'text-xs' : 'text-sm'}
                        />
                        <Input
                          label={idx === 0 ? 'URL' : ''}
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...formData.links];
                            newLinks[idx].url = e.target.value;
                            setFormData({ ...formData, links: newLinks });
                          }}
                          placeholder="example.com or https://..."
                          className="flex-1"
                          labelClassName={isMobile ? 'text-xs' : 'text-sm'}
                        />
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                links: formData.links.filter((_, i) => i !== idx),
                              });
                            }}
                            className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                            style={{ padding: isMobile ? '2px' : '8px', marginTop: idx === 0 ? (isMobile ? '20px' : '28px') : '0px' }}
                            title="Remove link"
                          >
                            <Trash2 size={isMobile ? 14 : 18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      links: [...formData.links, { label: '', url: '' }],
                    });
                  }} style={{ marginTop: isMobile ? '4px' : '8px', marginBottom: isMobile ? '8px' : '8px', paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}>
                    <Plus size={isMobile ? 12 : 16} />
                    Add Link
                  </Button>
                </div>
                <div className={isMobile ? 'flex gap-2' : 'flex gap-3'} style={{ paddingTop: isMobile ? '6px' : '4px' }}>
                  <Button
                    variant="primary"
                    size={isMobile ? 'sm' : 'md'}
                    type="submit"
                    style={{
                      backgroundColor: 'var(--button-secondary)',
                      color: settings.theme === 'light' ? '#000000' : 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--border)',
                      paddingLeft: isMobile ? '10px' : '16px',
                      paddingRight: isMobile ? '10px' : '16px'
                    }}
                  >
                    {editingId ? 'Save Changes' : 'Schedule Exam'}
                  </Button>
                  <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Exams List */}
          {filtered.length > 0 ? (
            <Card>
              <div className="divide-y divide-[var(--border)]" style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map((exam) => {
                  const course = courses.find((c) => c.id === exam.courseId);
                  const examHours = exam.examAt ? new Date(exam.examAt).getHours() : null;
                  const examMinutes = exam.examAt ? new Date(exam.examAt).getMinutes() : null;
                  const examTime = exam.examAt ? new Date(exam.examAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const shouldShowTime = examTime && !(examHours === 9 && examMinutes === 0);
                  const isSelected = bulkSelect.isSelected(exam.id);
                  return (
                    <div
                      key={exam.id}
                      style={{
                        paddingTop: isMobile ? '6px' : '10px',
                        paddingBottom: isMobile ? '6px' : '10px',
                        paddingLeft: isMobile ? '2px' : '16px',
                        paddingRight: isMobile ? '2px' : '16px',
                        gap: isMobile ? '8px' : '12px',
                        opacity: hidingExams.has(exam.id) ? 0.5 : 1,
                        transition: 'opacity 0.3s ease, background-color 0.2s ease',
                        backgroundColor: isSelected ? 'var(--nav-active)' : undefined,
                      }}
                      className="first:pt-0 last:pb-0 flex items-center group hover:bg-[var(--panel-2)] rounded transition-colors border-b border-[var(--border)] last:border-b-0"
                      onContextMenu={(e) => bulkSelect.handleContextMenu(e, exam.id)}
                      onTouchStart={() => bulkSelect.handleLongPressStart(exam.id)}
                      onTouchEnd={bulkSelect.handleLongPressEnd}
                      onTouchCancel={bulkSelect.handleLongPressEnd}
                      onClick={() => {
                        if (bulkSelect.isSelecting) {
                          bulkSelect.toggleSelection(exam.id);
                        }
                      }}
                    >
                      {/* Selection checkbox - appears when in selection mode */}
                      {bulkSelect.isSelecting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bulkSelect.toggleSelection(exam.id);
                          }}
                          style={{
                            width: isMobile ? '20px' : '24px',
                            height: isMobile ? '20px' : '24px',
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '2px solid var(--border)',
                            backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginRight: isMobile ? '4px' : '8px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected && <Check size={isMobile ? 12 : 14} color="white" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0" style={{ lineHeight: 1.4 }}>
                        <div className="flex items-center" style={{ gap: isMobile ? '2px' : '6px' }}>
                          <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '500', color: 'var(--text)' }}>
                            {exam.title}
                          </div>
                          {exam.status !== 'scheduled' && (
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', backgroundColor: 'rgba(100, 100, 100, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                              {exam.status}
                            </span>
                          )}
                        </div>
                        {exam.notes && (
                          <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {exam.notes}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap" style={{ gap: isMobile ? '2px' : '6px', marginTop: '3px' }}>
                          {exam.examAt && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {formatDate(exam.examAt)} {shouldShowTime && `at ${examTime}`}
                            </span>
                          )}
                          {exam.location && (
                            <span className="flex items-center" style={{ gap: isMobile ? '1px' : '4px', fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              <MapPin size={isMobile ? 12 : 14} />
                              {exam.location}
                            </span>
                          )}
                          {course && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {course.code}
                            </span>
                          )}
                        </div>
                        {exam.tags && exam.tags.length > 0 && (
                          <div className="flex flex-wrap" style={{ gap: '4px', marginTop: '4px' }}>
                            {exam.tags.map((tag: string) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: isMobile ? '10px' : '11px',
                                  backgroundColor: 'var(--panel-2)',
                                  color: 'var(--text-muted)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {exam.links && exam.links.length > 0 && (
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            {exam.links.map((link: any) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--link)', width: 'fit-content' }}
                                className="hover:text-blue-400"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ gap: isMobile ? '8px' : '12px' }}>
                        <button
                          onClick={() => startEdit(exam)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Edit exam"
                        >
                          <Edit2 size={isMobile ? 14 : 20} />
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Delete exam"
                        >
                          <Trash2 size={isMobile ? 14 : 20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No exams"
              description={
                filter === 'all'
                  ? 'Schedule an exam to get started'
                  : filter === 'upcoming'
                    ? 'No upcoming exams'
                    : 'No past exams'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all exams', onClick: () => setFilter('all') }
                  : { label: 'Schedule an exam', onClick: () => { setShowForm(true); setFormError(''); } }
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
          entityType="exam"
          onAction={handleBulkAction}
          onCancel={bulkSelect.clearSelection}
          onSelectAll={() => bulkSelect.selectAll(filtered.map(e => e.id))}
        />
      )}

      {/* Bulk Action Modals */}
      <BulkChangeCourseModal
        isOpen={bulkModal === 'course'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        courses={courses}
        onConfirm={handleBulkCourseChange}
      />
      <BulkChangeTagsModal
        isOpen={bulkModal === 'tags'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        allTags={allTags}
        onConfirm={handleBulkTagsChange}
      />
      <BulkChangeDateModal
        isOpen={bulkModal === 'date'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        onConfirm={handleBulkDateChange}
      />
      <BulkChangeTimeModal
        isOpen={bulkModal === 'time'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        onConfirm={handleBulkTimeChange}
      />
      <BulkChangeLocationModal
        isOpen={bulkModal === 'location'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        onConfirm={handleBulkLocationChange}
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
        entityType="exam"
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
