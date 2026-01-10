'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { isToday, formatDate, isOverdue } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2, Repeat } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import RecurrenceSelector from '@/components/RecurrenceSelector';
import TagInput from '@/components/notes/TagInput';
import { RecurringTaskFormData } from '@/types';

// Helper function to format recurring pattern as human-readable text
function getRecurrenceText(pattern: any): string {
  if (!pattern) return '';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let text = '';

  switch (pattern.recurrenceType) {
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

export default function TasksPage() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingTasks, setHidingTasks] = useState<Set<string>>(new Set());
  const [toggledTasks, setToggledTasks] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    importance: '' as '' | 'low' | 'medium' | 'high',
    notes: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
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
      dueTime: '23:59',
    } as RecurringTaskFormData,
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [importanceFilter, setImportanceFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const { courses, tasks, settings, addTask, updateTask, deleteTask, toggleTaskDone, addRecurringTask, updateRecurringPattern, initializeStore } = useAppStore();

  // Handle filters card collapse state changes and save to database
  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== 'tasks-filters')  // Remove from array when opening
      : [...currentCollapsed, 'tasks-filters'];  // Add to array when closing

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
            console.error('[Tasks] Save failed:', err);
          });
        }
        return res.json();
      })
      .catch(err => console.error('[Tasks] Failed to save filters collapse state:', err));
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

    // Handle recurring task creation
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
        await addRecurringTask(
          {
            title: formData.title,
            courseId: formData.courseId || null,
            notes: formData.notes,
            tags: formData.tags,
            links,
          },
          formData.recurring
        );
      } catch (error) {
        console.error('Error creating recurring task:', error);
      }
      setFormData({
        title: '',
        courseId: '',
        dueDate: '',
        dueTime: '',
        importance: '',
        notes: '',
        tags: [],
        links: [{ label: '', url: '' }],
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
          dueTime: '23:59',
        },
      });
      setShowForm(false);
      return;
    }

    // Handle regular task creation
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
      // Check if this is a recurring task being edited
      const editingTask = tasks.find(t => t.id === editingId);

      console.log('[handleSubmit] Editing task:', {
        id: editingTask?.id,
        isRecurring: editingTask?.isRecurring,
        hasRecurringPattern: !!editingTask?.recurringPattern,
        patternId: editingTask?.recurringPatternId,
      });

      if (editingTask?.isRecurring && editingTask?.recurringPattern && editingTask?.recurringPatternId) {
        // Update recurring pattern if settings changed
        console.log('[handleSubmit] Calling updateRecurringPattern with data:', {
          patternId: editingTask.recurringPatternId,
          recurring: formData.recurring,
        });
        try {
          await updateRecurringPattern(editingTask.recurringPatternId,
            {
              title: formData.title,
              courseId: formData.courseId || null,
              notes: formData.notes,
              links,
            },
            formData.recurring
          );
        } catch (error) {
          console.error('Error updating recurring pattern:', error);
        }
      } else {
        // Update regular task
        console.log('[handleSubmit] Updating as regular task');
        await updateTask(editingId, {
          title: formData.title,
          courseId: formData.courseId || null,
          dueAt,
          importance: formData.importance || null,
          notes: formData.notes,
          tags: formData.tags,
          links,
        });
      }
      setEditingId(null);
    } else {
      await addTask({
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        pinned: false,
        importance: formData.importance || null,
        checklist: [],
        notes: formData.notes,
        tags: formData.tags,
        links,
        status: 'open',
        recurringPatternId: null,
        instanceDate: null,
        isRecurring: false,
      });
    }

    setFormData({
      title: '',
      courseId: '',
      dueDate: '',
      dueTime: '',
      importance: '',
      notes: '',
      tags: [],
      links: [{ label: '', url: '' }],
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
        dueTime: '23:59',
      },
    });
    setShowForm(false);
  };

  const startEdit = (task: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(task.id);
    const dueDate = task.dueAt ? new Date(task.dueAt) : null;
    let dateStr = '';
    let timeStr = '';
    if (dueDate) {
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const date = String(dueDate.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${date}`;
      timeStr = `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
    }

    // Load recurring pattern data if this is a recurring task
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
      dueTime: '23:59',
    };

    if (task.isRecurring && task.recurringPattern) {
      const pattern = task.recurringPattern;
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
        dueTime: pattern.taskTemplate?.dueTime || '23:59',
      };
    }

    setFormData({
      title: task.title,
      courseId: task.courseId || '',
      dueDate: dateStr,
      dueTime: timeStr,
      importance: task.importance || '',
      notes: task.notes,
      tags: task.tags || [],
      links: task.links && task.links.length > 0 ? task.links : [{ label: '', url: '' }],
      isRecurring: task.isRecurring || false,
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
      importance: '',
      notes: '',
      tags: [],
      links: [{ label: '', url: '' }],
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
        dueTime: '23:59',
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

  // Collect all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || [])));

  const filtered = tasks
    .filter((t) => {
      // Always include toggled tasks (keep them visible after status change)
      if (toggledTasks.has(t.id)) {
        return true;
      }

      if (filter === 'today') return t.dueAt && isToday(t.dueAt) && t.status === 'open';
      if (filter === 'done') return t.status === 'done';
      if (filter === 'overdue') {
        return t.dueAt && new Date(t.dueAt) < new Date() && t.status === 'open';
      }
      if (filter === 'no-date') return !t.dueAt && t.status === 'open';
      return t.status === 'open';
    })
    .filter((t) => {
      // Filter by course if a course is selected
      if (courseFilter && t.courseId !== courseFilter) return false;
      return true;
    })
    .filter((t) => {
      // Filter by importance if selected
      if (importanceFilter && t.importance !== importanceFilter) return false;
      return true;
    })
    .filter((t) => {
      // Filter by selected tags
      if (selectedTags.size > 0 && !t.tags?.some((tag) => selectedTags.has(tag))) return false;
      return true;
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === t.courseId);
      const dateSearchStrings = getDateSearchStrings(t.dueAt);
      const timeSearchStrings = getTimeSearchStrings(t.dueAt);

      return (
        t.title.toLowerCase().includes(query) ||
        t.notes.toLowerCase().includes(query) ||
        (course && course.code.toLowerCase().includes(query)) ||
        t.links.some((link) => link.label.toLowerCase().includes(query) || link.url.toLowerCase().includes(query)) ||
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

      if (aHasDue && !bHasDue) return -1; // Tasks with dates come first
      if (!aHasDue && bHasDue) return 1; // Tasks without dates come last

      // Both don't have due dates, sort alphabetically
      return a.title.localeCompare(b.title);
    });

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Organize your work"
        actions={
          <Button variant="secondary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            New Task
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ gap: isMobile ? '16px' : undefined, overflow: 'visible' }}>
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: isMobile ? undefined : '107px', alignSelf: 'start' }}>
            {isMobile ? (
              <CollapsibleCard
                id="tasks-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('tasks-filters')}
                onChange={handleFiltersCollapseChange}
              >
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
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
                    label="Importance"
                    value={importanceFilter}
                    onChange={(e) => setImportanceFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
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
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Tasks' },
                    { value: 'today', label: 'Today' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'no-date', label: 'No Due Date' },
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
                      style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </CollapsibleCard>
            ) : (
              <Card>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: isMobile ? '10px' : '16px' }}>Filters</h3>
                <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
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
                    label="Importance"
                    value={importanceFilter}
                    onChange={(e) => setImportanceFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
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
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Tasks' },
                    { value: 'today', label: 'Today' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'no-date', label: 'No Due Date' },
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
                      style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Task list - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>

            {/* Add Task Form */}
            {showForm && (
            <div style={{ overflow: 'visible' }}>
              <Card>
                <form onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-3'} style={{ overflow: 'visible' }}>
                <div style={{ paddingBottom: isMobile ? '0px' : '4px' }}>
                  <Input
                    label="Task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                {/* Course, Importance row */}
                <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'} style={{ overflow: 'visible', paddingTop: isMobile ? '4px' : '8px' }}>
                  <Select
                    label="Course"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <Select
                    label="Importance"
                    value={formData.importance}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value as '' | 'low' | 'medium' | 'high' })}
                    options={[
                      { value: '', label: 'None' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
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
                    onChange={(recurring) => setFormData({ ...formData, recurring: recurring as RecurringTaskFormData })}
                  />
                )}

                {/* Notes and Tags */}
                <div className="flex flex-col gap-2" style={{ paddingTop: isMobile ? '4px' : '8px' }}>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    style={isMobile ? { minHeight: '52px', height: '52px', padding: '8px 10px' } : { minHeight: '60px', height: '60px' }}
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
                  <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                    {formData.links.map((link, idx) => (
                      <div key={idx} className={isMobile ? 'flex gap-1 items-center' : 'flex gap-3 items-center'}>
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
                            style={{ padding: isMobile ? '4px' : '6px', marginTop: isMobile ? '20px' : '28px' }}
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
                    {editingId ? 'Save Changes' : 'Add Task'}
                  </Button>
                  <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Task List */}
          {filtered.length > 0 ? (
            <Card>
              <div className="divide-y divide-[var(--border)]" style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map((t) => {
                  const course = courses.find((c) => c.id === t.courseId);
                  const dueHours = t.dueAt ? new Date(t.dueAt).getHours() : null;
                  const dueMinutes = t.dueAt ? new Date(t.dueAt).getMinutes() : null;
                  const dueTime = t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueTask = t.dueAt && isOverdue(t.dueAt) && t.status === 'open';
                  const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                  return (
                    <div key={t.id} style={{ paddingTop: isMobile ? '6px' : '10px', paddingBottom: isMobile ? '6px' : '10px', paddingLeft: isMobile ? '2px' : '16px', paddingRight: isMobile ? '2px' : '16px', gap: isMobile ? '8px' : '12px', opacity: hidingTasks.has(t.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center group hover:bg-[var(--panel-2)] rounded transition-colors border-b border-[var(--border)] last:border-b-0">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => {
                          const isCurrentlyDone = t.status === 'done';
                          setToggledTasks(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(t.id)) {
                              newSet.delete(t.id);
                            } else {
                              newSet.add(t.id);
                            }
                            return newSet;
                          });
                          toggleTaskDone(t.id);
                          // Only fade out when marking as done, not when unchecking
                          if (!isCurrentlyDone) {
                            setTimeout(() => {
                              setHidingTasks(prev => new Set(prev).add(t.id));
                            }, 50);
                          } else {
                            // Remove from hiding when unchecking
                            setHidingTasks(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(t.id);
                              return newSet;
                            });
                          }
                        }}
                        style={{
                          appearance: 'none',
                          width: isMobile ? '16px' : '20px',
                          height: isMobile ? '16px' : '20px',
                          border: t.status === 'done' ? 'none' : '2px solid var(--border)',
                          borderRadius: '4px',
                          backgroundColor: t.status === 'done' ? 'var(--button-secondary)' : 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          backgroundImage: t.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                          backgroundSize: '100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        title={t.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="flex-1 min-w-0" style={{ lineHeight: 1.4 }}>
                        <div className="flex items-center" style={{ gap: isMobile ? '2px' : '6px' }}>
                          <div
                            className={`font-medium ${
                              t.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                            style={{ fontSize: isMobile ? '12px' : '14px' }}
                          >
                            {t.title}
                          </div>
                          {t.isRecurring && (
                            <Repeat
                              size={14}
                              style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                              aria-label="Recurring task"
                            />
                          )}
                          {isOverdueTask && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                        </div>
                        {t.notes && (
                          <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.notes}
                          </div>
                        )}
                        {t.isRecurring && t.recurringPattern && (
                          <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {getRecurrenceText(t.recurringPattern)}
                          </div>
                        )}
                        {t.tags && t.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {t.tags.slice(0, 3).map((tag) => (
                              <span key={tag} style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--link)', backgroundColor: 'var(--panel-2)', padding: '1px 6px', borderRadius: '4px' }}>
                                #{tag}
                              </span>
                            ))}
                            {t.tags.length > 3 && (
                              <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-muted)' }}>
                                +{t.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap" style={{ gap: isMobile ? '2px' : '6px', marginTop: '3px' }}>
                          {t.dueAt && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {formatDate(t.dueAt)} {shouldShowTime && `at ${dueTime}`}
                            </span>
                          )}
                          {course && (
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)' }}>
                              {course.code}
                            </span>
                          )}
                          {t.importance && (
                            <span style={{
                              fontSize: isMobile ? '10px' : '11px',
                              fontWeight: '600',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: t.importance === 'high' ? 'rgba(239, 68, 68, 0.15)' : t.importance === 'medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              color: t.importance === 'high' ? '#ef4444' : t.importance === 'medium' ? '#eab308' : '#22c55e',
                            }}>
                              {t.importance.charAt(0).toUpperCase() + t.importance.slice(1)}
                            </span>
                          )}
                        </div>
                        {t.links && t.links.length > 0 && (
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            {t.links.map((link: any) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--link)' }}
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
                          onClick={() => startEdit(t)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Edit task"
                        >
                          <Edit2 size={isMobile ? 14 : 20} />
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Delete task"
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
              title="No tasks"
              description={
                filter === 'all'
                  ? 'Create a new task to get started'
                  : filter === 'today'
                    ? 'No tasks due today'
                    : 'No completed tasks yet'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all tasks', onClick: () => setFilter('all') }
                  : { label: 'Create a task', onClick: () => setShowForm(true) }
              }
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
