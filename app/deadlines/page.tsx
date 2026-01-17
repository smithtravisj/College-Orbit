'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';
import { formatDate, isOverdue } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2, Repeat, Hammer, Check, X, Upload, FileIcon, ChevronDown } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import RecurrenceSelector from '@/components/RecurrenceSelector';
import TagInput from '@/components/notes/TagInput';
import BulkEditToolbar, { BulkAction } from '@/components/BulkEditToolbar';
import {
  BulkChangeCourseModal,
  BulkChangeTagsModal,
  BulkChangePriorityModal,
  BulkChangeDateModal,
  BulkChangeTimeModal,
  BulkAddLinkModal,
  BulkDeleteModal,
} from '@/components/BulkActionModals';
import { RecurringDeadlineFormData } from '@/types';
import FilePreviewModal from '@/components/FilePreviewModal';

// Helper function to format recurring pattern as human-readable text
function getRecurrenceText(pattern: any): string {
  if (!pattern) return '';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let text = '';

  switch (pattern.recurrenceType) {
    case 'daily': {
      text = 'Every day';
      break;
    }
    case 'weekly': {
      const days = (pattern.daysOfWeek as number[])
        .sort((a, b) => a - b)
        .map((d) => dayNames[d]);
      text = `Every week on ${days.join(', ')}`;
      break;
    }
    case 'monthly': {
      const days = (pattern.daysOfMonth as number[])
        .sort((a, b) => a - b)
        .map((d) => `${d}${['st', 'nd', 'rd'][d % 10 - 1] || 'th'}`);
      text = `Monthly on the ${days.join(', ')}`;
      break;
    }
    case 'custom': {
      const interval = pattern.intervalDays || 1;
      text = `Every ${interval} day${interval > 1 ? 's' : ''}`;
      break;
    }
  }

  // Add end condition
  if (pattern.endDate) {
    text += ` until ${formatDate(pattern.endDate)}`;
  } else if (pattern.occurrenceCount) {
    text += ` for ${pattern.occurrenceCount} occurrences`;
  }

  return text;
}

export default function DeadlinesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const colorPalette = getCollegeColorPalette(university || null, theme);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingDeadlines, setHidingDeadlines] = useState<Set<string>>(new Set());
  const [toggledDeadlines, setToggledDeadlines] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    effort: '' as '' | 'small' | 'medium' | 'large',
    notes: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
    files: [] as Array<{ name: string; url: string; size: number }>,
    isRecurring: false,
    recurring: {
      isRecurring: false,
      recurrenceType: 'weekly' as const,
      customIntervalDays: 7,
      daysOfWeek: [1], // Default to Monday
      daysOfMonth: [1], // Default to 1st of month
      startDate: '',
      endCondition: 'never' as const,
      endDate: '',
      occurrenceCount: 10,
    } as RecurringDeadlineFormData,
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [effortFilter, setEffortFilter] = useState('');
  const [previewingDeadline, setPreviewingDeadline] = useState<any>(null);
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Bulk selection state
  const bulkSelect = useBulkSelect();
  const [bulkModal, setBulkModal] = useState<BulkAction | null>(null);
  const [showDeleteAllCompleted, setShowDeleteAllCompleted] = useState(false);
  const [hideRecurringCompleted, setHideRecurringCompleted] = useState(false);

  const { courses, deadlines, settings, addDeadline, updateDeadline, deleteDeadline, addRecurringDeadline, updateRecurringDeadlinePattern, bulkUpdateDeadlines, bulkDeleteDeadlines, initializeStore } = useAppStore();
  const isMobile = useIsMobile();

  // Handle filters card collapse state changes and save to database
  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== 'deadlines-filters')
      : [...currentCollapsed, 'deadlines-filters'];

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
            console.error('[Deadlines] Save failed:', err);
          });
        }
        return res.json();
      })
      .catch(err => console.error('[Deadlines] Failed to save filters collapse state:', err));
  };

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  // Reset hideRecurringCompleted when filter changes away from 'done'
  useEffect(() => {
    if (filter !== 'done') {
      setHideRecurringCompleted(false);
    }
  }, [filter]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formDataUpload,
        });
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({ ...prev, files: [...(prev.files || []), data.file] }));
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Handle links - normalize and add https:// if needed
    const links = formData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http://') || l.url.startsWith('https://')
          ? l.url
          : `https://${l.url}`
      }));

    // Handle recurring deadline creation
    if (formData.isRecurring && !editingId) {
      // Validate recurring pattern
      const recurring = formData.recurring;

      // Ensure at least one day is selected for week-based recurrence
      if (recurring.recurrenceType === 'weekly' && recurring.daysOfWeek.length === 0) {
        alert('Please select at least one day of the week');
        return;
      }

      // Ensure at least one day is selected for monthly recurrence
      if (recurring.recurrenceType === 'monthly' && recurring.daysOfMonth.length === 0) {
        alert('Please select at least one day of the month');
        return;
      }

      // Ensure valid interval for custom recurrence
      if (recurring.recurrenceType === 'custom' && (!recurring.customIntervalDays || recurring.customIntervalDays < 1)) {
        alert('Please enter a valid interval (1 or more days)');
        return;
      }

      try {
        await addRecurringDeadline(
          {
            title: formData.title,
            courseId: formData.courseId || null,
            notes: formData.notes,
            tags: formData.tags,
            links,
            effort: formData.effort || null,
          },
          formData.recurring
        );
      } catch (error) {
        console.error('Error creating recurring deadline:', error);
      }
      setFormData({
        title: '',
        courseId: '',
        dueDate: '',
        dueTime: '',
        effort: '',
        notes: '',
        tags: [],
        links: [{ label: '', url: '' }],
        files: [],
        isRecurring: false,
        recurring: {
          isRecurring: false,
          recurrenceType: 'weekly',
          customIntervalDays: 7,
          daysOfWeek: [1],
          daysOfMonth: [1],
          startDate: '',
          endCondition: 'never',
          endDate: '',
          occurrenceCount: 10,
        },
      });
      setShowForm(false);
      return;
    }

    // Handle regular deadline creation
    let dueAt: string | null = null;
    // Only set dueAt if we have a valid date string (not empty, not null, not whitespace)
    if (formData.dueDate && formData.dueDate.trim()) {
      try {
        // If date is provided but time is not, default to 11:59 PM
        const dateTimeString = formData.dueTime ? `${formData.dueDate}T${formData.dueTime}` : `${formData.dueDate}T23:59`;
        const dateObj = new Date(dateTimeString);
        // Verify it's a valid date and not the epoch
        if (dateObj.getTime() > 0) {
          dueAt = dateObj.toISOString();
        }
      } catch (err) {
        // If date parsing fails, leave dueAt as null
        console.error('Date parsing error:', err);
      }
    } else {
      // If time is provided but date is not, ignore the time
      formData.dueTime = '';
    }

    if (editingId) {
      // Check if this is a recurring deadline being edited
      const editingDeadline = deadlines.find(d => d.id === editingId);

      if (editingDeadline?.isRecurring && editingDeadline?.recurringPattern && editingDeadline?.recurringPatternId) {
        // Update recurring pattern if settings changed
        try {
          await updateRecurringDeadlinePattern(editingDeadline.recurringPatternId,
            {
              title: formData.title,
              courseId: formData.courseId || null,
              notes: formData.notes,
              tags: formData.tags,
              links,
              effort: formData.effort || null,
            },
            formData.recurring
          );
        } catch (error) {
          console.error('Error updating recurring deadline pattern:', error);
        }
      } else {
        // Update regular deadline
        await updateDeadline(editingId, {
          title: formData.title,
          courseId: formData.courseId || null,
          dueAt,
          effort: formData.effort || null,
          notes: formData.notes,
          tags: formData.tags,
          links,
          files: formData.files,
        });
      }
      setEditingId(null);
    } else {
      await addDeadline({
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        effort: formData.effort || null,
        priority: null,
        workingOn: false,
        notes: formData.notes,
        tags: formData.tags,
        links,
        files: formData.files,
        status: 'open',
        recurringPatternId: null,
        instanceDate: null,
        isRecurring: false,
        updatedAt: new Date().toISOString(),
      });
    }

    setFormData({
      title: '',
      courseId: '',
      dueDate: '',
      dueTime: '',
      effort: '',
      notes: '',
      tags: [],
      links: [{ label: '', url: '' }],
      files: [],
      isRecurring: false,
      recurring: {
        isRecurring: false,
        recurrenceType: 'weekly',
        customIntervalDays: 7,
        daysOfWeek: [1],
        daysOfMonth: [1],
        startDate: '',
        endCondition: 'never',
        endDate: '',
        occurrenceCount: 10,
      },
    });
    setShowForm(false);
  };

  const startEdit = (deadline: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(deadline.id);
    const dueDate = deadline.dueAt ? new Date(deadline.dueAt) : null;
    let dateStr = '';
    let timeStr = '';
    if (dueDate) {
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const date = String(dueDate.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${date}`;
      timeStr = `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
    }

    // Load recurring pattern data if this is a recurring deadline
    let recurringData: any = {
      isRecurring: false,
      recurrenceType: 'weekly',
      customIntervalDays: 7,
      daysOfWeek: [1],
      daysOfMonth: [1],
      startDate: '',
      endCondition: 'never',
      endDate: '',
      occurrenceCount: 10,
    };

    if (deadline.isRecurring && deadline.recurringPattern) {
      const pattern = deadline.recurringPattern;
      recurringData = {
        isRecurring: true,
        recurrenceType: pattern.recurrenceType,
        customIntervalDays: pattern.intervalDays || 7,
        daysOfWeek: pattern.daysOfWeek || [1],
        daysOfMonth: pattern.daysOfMonth || [1],
        startDate: pattern.startDate ? pattern.startDate.split('T')[0] : '',
        endCondition: pattern.endDate ? 'date' : (pattern.occurrenceCount ? 'count' : 'never'),
        endDate: pattern.endDate ? pattern.endDate.split('T')[0] : '',
        occurrenceCount: pattern.occurrenceCount || 10,
      };
    }

    setFormData({
      title: deadline.title,
      courseId: deadline.courseId || '',
      dueDate: dateStr,
      dueTime: timeStr,
      effort: deadline.effort || '',
      notes: deadline.notes,
      tags: deadline.tags || [],
      links: deadline.links && deadline.links.length > 0 ? deadline.links : [{ label: '', url: '' }],
      files: deadline.files || [],
      isRecurring: deadline.isRecurring || false,
      recurring: recurringData,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      courseId: '',
      dueDate: '',
      dueTime: '',
      effort: '',
      notes: '',
      tags: [],
      links: [{ label: '', url: '' }],
      files: [],
      isRecurring: false,
      recurring: {
        isRecurring: false,
        recurrenceType: 'weekly',
        customIntervalDays: 7,
        daysOfWeek: [1],
        daysOfMonth: [1],
        startDate: '',
        endCondition: 'never',
        endDate: '',
        occurrenceCount: 10,
      },
    });
    setShowForm(false);
  };

  const getDateSearchStrings = (dueAt: string | null | undefined): string[] => {
    if (!dueAt) return [];

    const date = new Date(dueAt);
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

  const getTimeSearchStrings = (dueAt: string | null | undefined): string[] => {
    if (!dueAt) return [];

    const date = new Date(dueAt);
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

  // Collect all unique tags from deadlines
  const allTags = Array.from(new Set(deadlines.flatMap((d) => d.tags || [])));

  // Bulk action handlers
  const handleBulkAction = (action: BulkAction) => {
    if (action === 'complete') {
      // Mark all selected as done with fade effect (same as individual completion)
      const ids = Array.from(bulkSelect.selectedIds);
      // Add to toggledDeadlines to keep them visible
      setToggledDeadlines(prev => {
        const newSet = new Set(prev);
        ids.forEach(id => newSet.add(id));
        return newSet;
      });
      // Update the deadlines
      bulkUpdateDeadlines(ids, { status: 'done' });
      // Add fade effect after delay
      setTimeout(() => {
        setHidingDeadlines(prev => {
          const newSet = new Set(prev);
          ids.forEach(id => newSet.add(id));
          return newSet;
        });
      }, 50);
    } else {
      setBulkModal(action);
    }
  };

  const handleBulkCourseChange = async (courseId: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkUpdateDeadlines(ids, { courseId });
  };

  const handleBulkTagsChange = async (tags: string[], mode: 'add' | 'replace') => {
    const ids = Array.from(bulkSelect.selectedIds);
    if (mode === 'replace') {
      await bulkUpdateDeadlines(ids, { tags });
    } else {
      for (const id of ids) {
        const deadline = deadlines.find(d => d.id === id);
        if (deadline) {
          const newTags = Array.from(new Set([...(deadline.tags || []), ...tags]));
          await updateDeadline(id, { tags: newTags });
        }
      }
    }
  };

  const handleBulkPriorityChange = async (value: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkUpdateDeadlines(ids, { effort: value as 'small' | 'medium' | 'large' | null });
  };

  const handleBulkDateChange = async (date: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const deadline = deadlines.find(d => d.id === id);
      if (deadline) {
        let dueAt: string | null = null;
        if (date) {
          const existingTime = deadline.dueAt ? new Date(deadline.dueAt).toTimeString().slice(0, 5) : '23:59';
          dueAt = new Date(`${date}T${existingTime}`).toISOString();
        }
        await updateDeadline(id, { dueAt });
      }
    }
  };

  const handleBulkTimeChange = async (time: string | null) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const deadline = deadlines.find(d => d.id === id);
      if (deadline && deadline.dueAt) {
        const existingDate = new Date(deadline.dueAt).toISOString().split('T')[0];
        const dueAt = time ? new Date(`${existingDate}T${time}`).toISOString() : deadline.dueAt;
        await updateDeadline(id, { dueAt });
      }
    }
  };

  const handleBulkAddLink = async (link: { label: string; url: string }) => {
    const ids = Array.from(bulkSelect.selectedIds);
    for (const id of ids) {
      const deadline = deadlines.find(d => d.id === id);
      if (deadline) {
        const newLinks = [...(deadline.links || []), link];
        await updateDeadline(id, { links: newLinks });
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(bulkSelect.selectedIds);
    await bulkDeleteDeadlines(ids);
    bulkSelect.clearSelection();
  };

  // Delete all completed assignments - ONLY deletes non-recurring assignments with status === 'done'
  const handleDeleteAllCompleted = async () => {
    try {
      const completedIds = deadlines
        .filter((d) => d.status === 'done' && !d.isRecurring && !d.recurringPatternId)
        .map((d) => d.id);
      if (completedIds.length > 0) {
        await bulkDeleteDeadlines(completedIds);
        // Remove any selected tags that no longer exist in remaining items
        const remainingDeadlines = deadlines.filter((d) => !completedIds.includes(d.id));
        const remainingTags = new Set(remainingDeadlines.flatMap((d) => d.tags || []));
        setSelectedTags((prev) => new Set([...prev].filter((tag) => remainingTags.has(tag))));
        // Hide recurring completed items from the done filter
        setHideRecurringCompleted(true);
      }
    } finally {
      setShowDeleteAllCompleted(false);
    }
  };

  const completedCount = deadlines.filter((d) => d.status === 'done' && !d.isRecurring && !d.recurringPatternId).length;

  const filtered = deadlines
    .filter((d) => {
      // Always include toggled deadlines (keep them visible after status change)
      if (toggledDeadlines.has(d.id)) {
        return true;
      }

      if (filter === 'overdue') return d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
      if (filter === 'working-on') return d.workingOn && d.status === 'open';
      if (filter === 'due-soon') {
        if (!d.dueAt || d.status !== 'open') return false;
        const dueDate = new Date(d.dueAt);
        const windowEnd = new Date();
        windowEnd.setDate(windowEnd.getDate() + settings.dueSoonWindowDays);
        return dueDate <= windowEnd && !isOverdue(d.dueAt);
      }
      if (filter === 'done') {
        if (hideRecurringCompleted && (d.isRecurring || d.recurringPatternId)) return false;
        return d.status === 'done';
      }
      return d.status === 'open';
    })
    .filter((d) => {
      // Filter by course if a course is selected
      if (courseFilter && d.courseId !== courseFilter) return false;
      return true;
    })
    .filter((d) => {
      // Filter by effort if selected
      if (effortFilter && d.effort !== effortFilter) return false;
      return true;
    })
    .filter((d) => {
      // Filter by selected tags
      if (selectedTags.size > 0 && !d.tags?.some((tag) => selectedTags.has(tag))) return false;
      return true;
    })
    .filter((d) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === d.courseId);
      const dateSearchStrings = getDateSearchStrings(d.dueAt);
      const timeSearchStrings = getTimeSearchStrings(d.dueAt);

      return (
        d.title.toLowerCase().includes(query) ||
        d.notes.toLowerCase().includes(query) ||
        (course && course.code.toLowerCase().includes(query)) ||
        d.links.some((link) => link.label.toLowerCase().includes(query) || link.url.toLowerCase().includes(query)) ||
        dateSearchStrings.some((dateStr) => dateStr.includes(query)) ||
        timeSearchStrings.some((timeStr) => timeStr.includes(query))
      );
    })
    .sort((a, b) => {
      // Sort by due date first
      const aHasDue = !!a.dueAt;
      const bHasDue = !!b.dueAt;

      if (aHasDue && bHasDue) {
        return new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime();
      }

      if (!aHasDue && bHasDue) return -1; // Deadlines without dates come first
      if (aHasDue && !bHasDue) return 1; // Deadlines with dates come after

      // Both don't have due dates, sort alphabetically
      return a.title.localeCompare(b.title);
    });

  return (
    <>
      {/* Assignments Header */}
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
                Assignments
              </h1>
            </div>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
              Your assignments and deadlines.
            </p>
          </div>
          <Button variant="secondary" size="md" style={{ marginTop: isMobile ? '12px' : '8px' }} onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (editingId || !showForm) {
                setEditingId(null);
                setFormData({
                  title: '',
                  courseId: courseFilter || '',
                  dueDate: '',
                  dueTime: '',
                  effort: (effortFilter || '') as '' | 'small' | 'medium' | 'large',
                  notes: '',
                  tags: Array.from(selectedTags),
                  links: [{ label: '', url: '' }],
                  files: [],
                  isRecurring: false,
                  recurring: {
                    isRecurring: false,
                    recurrenceType: 'weekly' as const,
                    customIntervalDays: 7,
                    daysOfWeek: [1],
                    daysOfMonth: [1],
                    startDate: '',
                    endCondition: 'never' as const,
                    endDate: '',
                    occurrenceCount: 10,
                  } as RecurringDeadlineFormData,
                });
                setShowForm(true);
              } else {
                setShowForm(false);
              }
            }}>
            <Plus size={18} />
            {isMobile ? 'New' : 'New Assignment'}
          </Button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ gap: isMobile ? '16px' : undefined, overflow: 'visible', position: 'relative', zIndex: 1 }}>
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: isMobile ? undefined : '24px', alignSelf: 'start' }}>
            {isMobile ? (
              <CollapsibleCard
                id="deadlines-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('deadlines-filters')}
                onChange={handleFiltersCollapseChange}
              >
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assignments..."
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
                                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Select
                    label="Effort"
                    value={effortFilter}
                    onChange={(e) => setEffortFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'large', label: 'Large' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'small', label: 'Small' },
                    ]}
                  />
                </div>
                {allTags.length > 0 && (
                  <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Tags</label>
                    <div className="space-y-1">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={() => {
                              const newTags = new Set(selectedTags);
                              if (newTags.has(tag)) {
                                newTags.delete(tag);
                              } else {
                                newTags.add(tag);
                              }
                              setSelectedTags(newTags);
                            }}
                            style={{ width: '16px', height: '16px' }}
                          />
                          #{tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'working-on', label: 'Working On' },
                    { value: 'due-soon', label: 'Due Soon' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'done', label: 'Completed' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                        filter === f.value
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                      }`}
                      style={{
                        padding: isMobile ? '8px 12px' : '12px 16px',
                        backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent',
                        backgroundImage: filter === f.value ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                        boxShadow: filter === f.value ? `0 0 10px ${colorPalette.accent}80` : 'none',
                        fontSize: isMobile ? '13px' : '14px',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </CollapsibleCard>
            ) : (
              <Card noAccent>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: isMobile ? '10px' : '12px' }}>Filters</h3>
                <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assignments..."
                  />
                </div>
                <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                  <Select
                    label="Course"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                  />
                </div>
                <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                  <Select
                    label="Effort"
                    value={effortFilter}
                    onChange={(e) => setEffortFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'large', label: 'Large' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'small', label: 'Small' },
                    ]}
                  />
                </div>
                {allTags.length > 0 && (
                  <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '6px' }}>Tags</label>
                    <div className="space-y-1">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={() => {
                              const newTags = new Set(selectedTags);
                              if (newTags.has(tag)) {
                                newTags.delete(tag);
                              } else {
                                newTags.add(tag);
                              }
                              setSelectedTags(newTags);
                            }}
                            style={{ width: '16px', height: '16px' }}
                          />
                          #{tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'working-on', label: 'Working On' },
                    { value: 'due-soon', label: 'Due Soon' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'done', label: 'Completed' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                        filter === f.value
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                      }`}
                      style={{
                        padding: isMobile ? '8px 12px' : '8px 14px',
                        backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent',
                        backgroundImage: filter === f.value ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                        boxShadow: filter === f.value ? `0 0 10px ${colorPalette.accent}80` : 'none',
                        fontSize: isMobile ? '13px' : '14px',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Deadlines list - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>

            {/* Add Deadline Form */}
            {showForm && (
            <div style={{ overflow: 'visible' }}>
              <Card>
                <form onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-3'} style={{ overflow: 'visible' }}>
                <div style={{ paddingBottom: isMobile ? '0px' : '4px' }}>
                  <Input
                    label="Assignment title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                {/* Course, Effort row */}
                <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'} style={{ overflow: 'visible', paddingTop: isMobile ? '4px' : '8px' }}>
                  <Select
                    label="Course"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <Select
                    label="Effort"
                    value={formData.effort}
                    onChange={(e) => setFormData({ ...formData, effort: e.target.value as '' | 'small' | 'medium' | 'large' })}
                    options={[
                      { value: '', label: 'None' },
                      { value: 'large', label: 'Large' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'small', label: 'Small' },
                    ]}
                  />
                  {!isMobile && !formData.isRecurring && (
                    <>
                      <CalendarPicker
                        label="Due Date"
                        value={formData.dueDate}
                        onChange={(date) => setFormData({ ...formData, dueDate: date })}
                      />
                      <TimePicker
                        label="Due Time"
                        value={formData.dueTime}
                        onChange={(time) => setFormData({ ...formData, dueTime: time })}
                      />
                    </>
                  )}
                  {!isMobile && formData.isRecurring && <div className="col-span-2" />}
                </div>

                {/* Due Date and Time row - mobile only */}
                {isMobile && !formData.isRecurring && (
                  <div className="grid grid-cols-2 gap-2" style={{ overflow: 'visible', paddingTop: '8px' }}>
                    <CalendarPicker
                      label="Due Date"
                      value={formData.dueDate}
                      onChange={(date) => setFormData({ ...formData, dueDate: date })}
                    />
                    <TimePicker
                      label="Due Time"
                      value={formData.dueTime}
                      onChange={(time) => setFormData({ ...formData, dueTime: time })}
                    />
                  </div>
                )}

                {/* Recurring checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: isMobile ? '4px' : '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px', fontWeight: '500', color: 'var(--text)' }}>
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked, recurring: { ...formData.recurring, isRecurring: e.target.checked } })}
                      style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px', cursor: 'pointer' }}
                    />
                    <Repeat size={isMobile ? 14 : 16} />
                    Recurring
                  </label>
                </div>

                {/* Recurrence selector */}
                {formData.isRecurring && (
                  <RecurrenceSelector
                    value={formData.recurring}
                    onChange={(recurring) => setFormData({ ...formData, recurring: recurring as RecurringDeadlineFormData })}
                  />
                )}

                {/* More Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    padding: '10px 0',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: isMobile ? '14px' : '14px',
                    fontWeight: 500,
                  }}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      transform: showMoreOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  More options
                </button>

                {showMoreOptions && (
                <>
                {/* Notes and Tags */}
                <div className="flex flex-col gap-2" style={{ paddingTop: isMobile ? '4px' : '8px' }}>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add details..."
                    autoExpand
                    maxHeight={200}
                    style={isMobile ? { minHeight: '52px', padding: '8px 10px' } : { minHeight: '60px' }}
                  />
                  <div style={{ marginTop: isMobile ? '-8px' : '-4px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: isMobile ? '4px' : '6px' }}>Tags</label>
                    <TagInput
                      tags={formData.tags}
                      onTagsChange={(tags) => setFormData({ ...formData, tags })}
                      allAvailableTags={allTags}
                      placeholder="Add tag..."
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
                          placeholder="e.g., Canvas"
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
                            style={{ padding: isMobile ? '4px' : '6px', marginTop: idx === 0 ? (isMobile ? '20px' : '28px') : '0px' }}
                            title="Remove link"
                          >
                            <Trash2 size={isMobile ? 18 : 20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size={isMobile ? 'sm' : 'sm'} type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      links: [...formData.links, { label: '', url: '' }],
                    });
                  }} style={{ marginTop: isMobile ? '4px' : '8px', marginBottom: isMobile ? '8px' : '8px', paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}>
                    <Plus size={isMobile ? 12 : 16} />
                    Add Link
                  </Button>
                </div>

                {/* File list display */}
                {formData.files && formData.files.length > 0 && (
                  <div style={{ paddingTop: isMobile ? '4px' : '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: isMobile ? '4px 8px' : '6px 10px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: 'var(--radius-control)',
                          border: '1px solid var(--border)',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                        }}
                      >
                        <input
                          type="text"
                          value={file.name}
                          onChange={(e) => {
                            const newFiles = [...formData.files];
                            newFiles[index] = { ...newFiles[index], name: e.target.value };
                            setFormData({ ...formData, files: newFiles });
                          }}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text)',
                            fontSize: 'inherit',
                            padding: 0,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, files: formData.files.filter((_, i) => i !== index) })}
                          style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: isMobile ? '6px' : '8px' }}>
                  <div className={isMobile ? 'flex gap-2' : 'flex gap-3'}>
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
                      {editingId ? 'Save Changes' : 'Add Assignment'}
                    </Button>
                    <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={isMobile ? 14 : 16} />
                    Add Files
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Deadlines List */}
          {filtered.length > 0 ? (
            <Card>
              {/* Delete All Completed Button */}
              {filter === 'done' && completedCount > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteAllCompleted(true)}
                  >
                    <Trash2 size={14} />
                    <span style={{ marginLeft: '6px' }}>Delete All Completed</span>
                  </Button>
                </div>
              )}
              <div className="space-y-4 divide-y divide-[var(--border)]">
                {filtered.map((d) => {
                  const course = courses.find((c) => c.id === d.courseId);
                  const dueHours = d.dueAt ? new Date(d.dueAt).getHours() : null;
                  const dueMinutes = d.dueAt ? new Date(d.dueAt).getMinutes() : null;
                  const dueTime = d.dueAt ? new Date(d.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueDeadline = d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
                  const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                  const isSelected = bulkSelect.isSelected(d.id);
                  return (
                    <div
                      key={d.id}
                      style={{
                        paddingTop: isMobile ? '6px' : '10px',
                        paddingBottom: isMobile ? '6px' : '10px',
                        paddingLeft: isMobile ? '2px' : '16px',
                        paddingRight: isMobile ? '2px' : '16px',
                        gap: isMobile ? '8px' : '12px',
                        opacity: hidingDeadlines.has(d.id) ? 0.5 : 1,
                        transition: 'opacity 0.3s ease, background-color 0.2s ease',
                        backgroundColor: isSelected ? 'var(--nav-active)' : undefined,
                        cursor: 'pointer',
                      }}
                      className="first:pt-0 last:pb-0 flex items-center group/deadline hover:bg-[var(--panel-2)] rounded transition-colors border-b border-[var(--border)] last:border-b-0"
                      onContextMenu={(e) => bulkSelect.handleContextMenu(e, d.id)}
                      onTouchStart={() => bulkSelect.handleLongPressStart(d.id)}
                      onTouchEnd={bulkSelect.handleLongPressEnd}
                      onTouchCancel={bulkSelect.handleLongPressEnd}
                      onClick={() => {
                        if (bulkSelect.isSelecting) {
                          bulkSelect.toggleSelection(d.id);
                        } else {
                          setPreviewingDeadline(d);
                        }
                      }}
                    >
                      {/* Selection checkbox - appears when in selection mode */}
                      {bulkSelect.isSelecting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bulkSelect.toggleSelection(d.id);
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
                      <input
                        type="checkbox"
                        checked={d.status === 'done'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => {
                          const isCurrentlyDone = d.status === 'done';
                          setToggledDeadlines(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(d.id)) {
                              newSet.delete(d.id);
                            } else {
                              newSet.add(d.id);
                            }
                            return newSet;
                          });
                          updateDeadline(d.id, {
                            status: isCurrentlyDone ? 'open' : 'done',
                          });
                          // Only fade out when marking as done, not when unchecking
                          if (!isCurrentlyDone) {
                            setTimeout(() => {
                              setHidingDeadlines(prev => new Set(prev).add(d.id));
                            }, 50);
                          } else {
                            // Remove from hiding when unchecking
                            setHidingDeadlines(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(d.id);
                              return newSet;
                            });
                          }
                        }}
                        style={{
                          appearance: 'none',
                          width: isMobile ? '16px' : '20px',
                          height: isMobile ? '16px' : '20px',
                          border: d.status === 'done' ? 'none' : '2px solid var(--border)',
                          borderRadius: '4px',
                          backgroundColor: d.status === 'done' ? 'var(--button-secondary)' : 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          backgroundImage: d.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                          backgroundSize: '100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        title={d.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="flex-1 min-w-0" style={{ lineHeight: 1.4 }}>
                        <div className="flex items-center" style={{ gap: isMobile ? '2px' : '6px' }}>
                          <div
                            className={`font-medium ${
                              d.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                            style={{ fontSize: isMobile ? '12px' : '14px' }}
                          >
                            {d.title}
                          </div>
                          {d.isRecurring && (
                            <Repeat
                              size={14}
                              style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                              aria-label="Recurring deadline"
                            />
                          )}
                          {d.workingOn && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--success)', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Working On</span>}
                          {isOverdueDeadline && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                        </div>
                        {d.notes && (
                          <div style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {d.notes}
                          </div>
                        )}
                        {d.isRecurring && d.recurringPattern && (
                          <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {getRecurrenceText(d.recurringPattern)}
                          </div>
                        )}
                        {d.tags && d.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {d.tags.slice(0, 3).map((tag) => (
                              <span key={tag} style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--link)', backgroundColor: 'var(--panel-2)', padding: '1px 6px', borderRadius: '4px' }}>
                                #{tag}
                              </span>
                            ))}
                            {d.tags.length > 3 && (
                              <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-muted)' }}>
                                +{d.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap" style={{ gap: isMobile ? '2px' : '6px', marginTop: '3px' }}>
                          {d.dueAt && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {formatDate(d.dueAt)} {shouldShowTime && `at ${dueTime}`}
                            </span>
                          )}
                          {course && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {course.code}
                            </span>
                          )}
                          {d.effort && (
                            <span style={{
                              fontSize: isMobile ? '10px' : '11px',
                              fontWeight: '600',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: d.effort === 'large' ? 'rgba(239, 68, 68, 0.15)' : d.effort === 'medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              color: d.effort === 'large' ? '#ef4444' : d.effort === 'medium' ? '#eab308' : '#22c55e',
                            }}>
                              {d.effort.charAt(0).toUpperCase() + d.effort.slice(1)}
                            </span>
                          )}
                        </div>
                        {d.links && d.links.length > 0 && (
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            {d.links.map((link: any) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--link)', width: 'fit-content' }}
                                className="hover:text-blue-400"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                        {d.files && d.files.length > 0 && (
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            {d.files.map((file: any, fileIndex: number) => (
                              <button
                                key={`${fileIndex}-${file.name}`}
                                type="button"
                                style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--link)', width: 'fit-content', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
                                className="hover:text-blue-400"
                                onClick={(e) => { e.stopPropagation(); setPreviewingFile({ file, allFiles: d.files || [], index: fileIndex }); }}
                              >
                                <FileIcon size={12} style={{ flexShrink: 0 }} />
                                {file.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover/deadline:opacity-100 transition-opacity flex-shrink-0" style={{ gap: isMobile ? '8px' : '12px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateDeadline(d.id, { workingOn: !d.workingOn }); }}
                          className={`rounded-[var(--radius-control)] transition-colors hover:bg-white/5 ${d.workingOn ? 'text-[var(--success)]' : 'text-[var(--muted)] hover:text-[var(--success)]'}`}
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title={d.workingOn ? 'Stop working on assignment' : 'Start working on assignment'}
                        >
                          <Hammer size={isMobile ? 14 : 20} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(d); }}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Edit assignment"
                        >
                          <Edit2 size={isMobile ? 14 : 20} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDeadline(d.id); }}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Delete assignment"
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
              title="No assignments"
              description={
                filter === 'all'
                  ? 'Create a new assignment to get started'
                  : filter === 'overdue'
                    ? 'No overdue assignments'
                    : 'No completed assignments'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all assignments', onClick: () => setFilter('all') }
                  : { label: 'Create an assignment', onClick: () => setShowForm(true) }
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
          entityType="deadline"
          onAction={handleBulkAction}
          onCancel={bulkSelect.clearSelection}
          onSelectAll={() => bulkSelect.selectAll(filtered.map(d => d.id))}
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
      <BulkChangePriorityModal
        isOpen={bulkModal === 'priority'}
        onClose={() => setBulkModal(null)}
        selectedCount={bulkSelect.selectedIds.size}
        entityType="deadline"
        onConfirm={handleBulkPriorityChange}
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
        entityType="deadline"
        onConfirm={handleBulkDelete}
      />

      {/* Delete All Completed Modal */}
      {showDeleteAllCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
            <div style={{ padding: '24px' }}>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Delete All Completed Assignments</h2>
              <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                Are you sure you want to delete {completedCount} completed assignment{completedCount !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowDeleteAllCompleted(false)}
                  style={{ paddingLeft: '16px', paddingRight: '16px' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleDeleteAllCompleted}
                  style={{
                    backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                    color: 'white',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                  }}
                >
                  Delete All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewingDeadline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '16px' : '24px',
          }}
          onClick={() => setPreviewingDeadline(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '16px' : '20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  margin: 0,
                  wordBreak: 'break-word',
                }}>
                  {previewingDeadline.title}
                </h2>
                {previewingDeadline.courseId && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {courses.find(c => c.id === previewingDeadline.courseId)?.code || courses.find(c => c.id === previewingDeadline.courseId)?.name}
                  </div>
                )}
              </div>
              <button
                onClick={() => setPreviewingDeadline(null)}
                style={{
                  padding: '4px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: isMobile ? '16px' : '20px' }}>
              {/* Status & Effort */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {previewingDeadline.status === 'done' && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                  }}>
                    Completed
                  </span>
                )}
                {previewingDeadline.effort && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: previewingDeadline.effort === 'large' ? 'rgba(239, 68, 68, 0.15)' :
                      previewingDeadline.effort === 'medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: previewingDeadline.effort === 'large' ? '#ef4444' :
                      previewingDeadline.effort === 'medium' ? '#eab308' : '#22c55e',
                  }}>
                    {previewingDeadline.effort.charAt(0).toUpperCase() + previewingDeadline.effort.slice(1)}
                  </span>
                )}
                {previewingDeadline.workingOn && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                  }}>
                    Working On
                  </span>
                )}
              </div>

              {/* Due Date */}
              {previewingDeadline.dueAt && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {formatDate(previewingDeadline.dueAt)}
                    {(() => {
                      const dueDate = new Date(previewingDeadline.dueAt);
                      const hours = dueDate.getHours();
                      const minutes = dueDate.getMinutes();
                      if (!(hours === 23 && minutes === 59)) {
                        return ` at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      }
                      return '';
                    })()}
                  </div>
                </div>
              )}

              {/* Recurring Pattern */}
              {previewingDeadline.isRecurring && previewingDeadline.recurringPattern && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Recurring</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {getRecurrenceText(previewingDeadline.recurringPattern)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {previewingDeadline.notes && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {previewingDeadline.notes}
                  </div>
                </div>
              )}

              {/* Tags */}
              {previewingDeadline.tags && previewingDeadline.tags.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Tags</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {previewingDeadline.tags.map((tag: string) => (
                      <span key={tag} style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--panel-2)',
                        color: 'var(--text-muted)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {previewingDeadline.links && previewingDeadline.links.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {previewingDeadline.links.map((link: { label: string; url: string }, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '14px',
                          color: 'var(--link)',
                          textDecoration: 'underline',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {previewingDeadline.files && previewingDeadline.files.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>Files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {previewingDeadline.files.map((file: { name: string; url: string; size: number }, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewingFile({ file, allFiles: previewingDeadline.files, index: i }); }}
                          style={{
                            fontSize: '14px',
                            color: 'var(--link)',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
                          {file.name}
                        </button>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: isMobile ? '16px' : '20px',
              borderTop: '1px solid var(--border)',
            }}>
              <Button
                variant="secondary"
                onClick={() => {
                  const deadline = previewingDeadline;
                  const isCurrentlyDone = deadline.status === 'done';
                  // Add to toggledDeadlines to keep it visible
                  setToggledDeadlines(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(deadline.id)) {
                      newSet.delete(deadline.id);
                    } else {
                      newSet.add(deadline.id);
                    }
                    return newSet;
                  });
                  updateDeadline(deadline.id, {
                    status: isCurrentlyDone ? 'open' : 'done',
                  });
                  // Only fade out when marking as done, not when unchecking
                  if (!isCurrentlyDone) {
                    setTimeout(() => {
                      setHidingDeadlines(prev => new Set(prev).add(deadline.id));
                    }, 50);
                  } else {
                    // Remove from hiding when unchecking
                    setHidingDeadlines(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(deadline.id);
                      return newSet;
                    });
                  }
                  setPreviewingDeadline(null);
                }}
                style={{ flex: 1 }}
              >
                <Check size={16} />
                {previewingDeadline.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setPreviewingDeadline(null);
                  startEdit(previewingDeadline);
                }}
                style={{ flex: 1 }}
              >
                <Edit2 size={16} />
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewingFile?.file ?? null}
        files={previewingFile?.allFiles}
        currentIndex={previewingFile?.index ?? 0}
        onClose={() => setPreviewingFile(null)}
        onNavigate={(file, index) => setPreviewingFile(prev => prev ? { ...prev, file, index } : null)}
      />
    </>
  );
}
