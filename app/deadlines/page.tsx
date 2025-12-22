'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { formatDate, isOverdue } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
import { RecurringDeadlineFormData } from '@/types';

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

export default function DeadlinesPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingDeadlines, setHidingDeadlines] = useState<Set<string>>(new Set());
  const [toggledDeadlines, setToggledDeadlines] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
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
    } as RecurringDeadlineFormData,
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { courses, deadlines, settings, addDeadline, updateDeadline, deleteDeadline, addRecurringDeadline, updateRecurringDeadlinePattern, initializeStore } = useAppStore();
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
            links,
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
        notes: '',
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
              links,
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
          notes: formData.notes,
          links,
        });
      }
      setEditingId(null);
    } else {
      await addDeadline({
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        notes: formData.notes,
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
      notes: '',
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
      },
    });
    setShowForm(false);
  };

  const startEdit = (deadline: any) => {
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
      notes: deadline.notes,
      links: deadline.links && deadline.links.length > 0 ? deadline.links : [{ label: '', url: '' }],
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
      notes: '',
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

  const filtered = deadlines
    .filter((d) => {
      // Always include toggled deadlines (keep them visible after status change)
      if (toggledDeadlines.has(d.id)) {
        return true;
      }

      if (filter === 'overdue') return d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
      if (filter === 'due-soon') {
        if (!d.dueAt || d.status !== 'open') return false;
        const dueDate = new Date(d.dueAt);
        const windowEnd = new Date();
        windowEnd.setDate(windowEnd.getDate() + settings.dueSoonWindowDays);
        return dueDate <= windowEnd && !isOverdue(d.dueAt);
      }
      if (filter === 'done') return d.status === 'done';
      return d.status === 'open';
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

      if (aHasDue && !bHasDue) return -1; // Deadlines with dates come first
      if (!aHasDue && bHasDue) return 1; // Deadlines without dates come last

      // Both don't have due dates, sort alphabetically
      return a.title.localeCompare(b.title);
    });

  return (
    <>
      <PageHeader
        title="Deadlines"
        subtitle="Track your assignments and exams"
        actions={
          <Button variant="secondary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            New Deadline
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ gap: isMobile ? '16px' : undefined, overflow: 'visible' }}>
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
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
                    placeholder="Search deadlines..."
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All' },
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
                      style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </CollapsibleCard>
            ) : (
              <Card>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>Filters</h3>
                <div style={{ marginBottom: '20px' }}>
                  <Input
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search deadlines..."
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All' },
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
                    style={{ padding: isMobile ? '8px 12px' : '12px 16px', backgroundColor: filter === f.value ? 'var(--nav-active)' : 'transparent', fontSize: isMobile ? '13px' : '14px' }}
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
            <div style={{ marginBottom: isMobile ? '16px' : '24px', overflow: 'visible' }}>
              <Card>
                <form onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-5'} style={{ overflow: 'visible' }}>
                <Input
                  label="Deadline title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
                <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
                  <Select
                    label="Course"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                </div>
                <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add details..."
                  />
                </div>

                {/* Recurring toggle */}
                <div style={{ paddingTop: isMobile ? '4px' : '12px', paddingBottom: isMobile ? '4px' : '12px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '4px' : '8px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500',
                      color: 'var(--text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRecurring: e.target.checked,
                          recurring: {
                            ...formData.recurring,
                            isRecurring: e.target.checked,
                          },
                        })
                      }
                      style={{
                        width: isMobile ? '14px' : '18px',
                        height: isMobile ? '14px' : '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <Repeat size={isMobile ? 14 : 16} />
                    Recurring deadline
                  </label>
                </div>

                {/* Recurrence selector */}
                {formData.isRecurring && (
                  <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
                    <RecurrenceSelector
                      value={formData.recurring}
                      onChange={(recurring) => setFormData({ ...formData, recurring: recurring as RecurringDeadlineFormData })}
                    />
                  </div>
                )}

                {/* Date/Time pickers - only show for non-recurring deadlines */}
                {!formData.isRecurring && (
                  <div className={isMobile ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-4'} style={{ overflow: 'visible' }}>
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
                <div style={{ paddingTop: isMobile ? '6px' : '20px' }}>
                  <label className={isMobile ? 'block text-sm font-medium text-[var(--text)]' : 'block text-lg font-medium text-[var(--text)]'} style={{ marginBottom: isMobile ? '3px' : '8px' }}>Links</label>
                  <div className={isMobile ? 'space-y-1' : 'space-y-3'}>
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
                  }} style={{ marginTop: isMobile ? '4px' : '12px', paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}>
                    <Plus size={isMobile ? 12 : 16} />
                    Add Link
                  </Button>
                </div>
                <div className={isMobile ? 'flex gap-2' : 'flex gap-3'} style={{ paddingTop: isMobile ? '10px' : '12px' }}>
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
                    {editingId ? 'Save Changes' : 'Add Deadline'}
                  </Button>
                  <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Deadlines List */}
          {filtered.length > 0 ? (
            <Card>
              <div className="space-y-4 divide-y divide-[var(--border)]">
                {filtered.map((d) => {
                  const course = courses.find((c) => c.id === d.courseId);
                  const dueHours = d.dueAt ? new Date(d.dueAt).getHours() : null;
                  const dueMinutes = d.dueAt ? new Date(d.dueAt).getMinutes() : null;
                  const dueTime = d.dueAt ? new Date(d.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueDeadline = d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
                  const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                  return (
                    <div key={d.id} style={{ paddingTop: isMobile ? '3px' : '12px', paddingBottom: isMobile ? '3px' : '12px', paddingLeft: isMobile ? '2px' : '20px', paddingRight: isMobile ? '2px' : '20px', gap: isMobile ? '8px' : '16px', opacity: hidingDeadlines.has(d.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center group hover:bg-[var(--panel-2)] rounded transition-colors border-b border-[var(--border)] last:border-b-0">
                      <input
                        type="checkbox"
                        checked={d.status === 'done'}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center" style={{ gap: isMobile ? '2px' : '8px' }}>
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
                          {isOverdueDeadline && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                        </div>
                        {d.notes && (
                          <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', marginTop: isMobile ? '0px' : '4px' }}>
                            {d.notes}
                          </div>
                        )}
                        {d.isRecurring && d.recurringPattern && (
                          <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', marginTop: isMobile ? '0px' : '4px' }}>
                            {getRecurrenceText(d.recurringPattern)}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap" style={{ gap: isMobile ? '2px' : '12px', marginTop: isMobile ? '0px' : '8px' }}>
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
                        </div>
                        {d.links && d.links.length > 0 && (
                          <div className="flex flex-col" style={{ gap: '0px', marginTop: isMobile ? '0px' : '8px' }}>
                            {d.links.map((link: any) => (
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
                          onClick={() => startEdit(d)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Edit deadline"
                        >
                          <Edit2 size={isMobile ? 14 : 20} />
                        </button>
                        <button
                          onClick={() => deleteDeadline(d.id)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          style={{ padding: isMobile ? '2px' : '6px' }}
                          title="Delete deadline"
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
              title="No deadlines"
              description={
                filter === 'all'
                  ? 'Create a new deadline to get started'
                  : filter === 'overdue'
                    ? 'No overdue deadlines'
                    : 'No completed deadlines'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all deadlines', onClick: () => setFilter('all') }
                  : { label: 'Create a deadline', onClick: () => setShowForm(true) }
              }
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
