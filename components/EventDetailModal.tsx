'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Course, Task, Deadline, Exam, CalendarEvent as CustomCalendarEvent, WorkItem } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';
import { CalendarEvent } from '@/lib/calendarUtils';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';
import FileUpload from '@/components/ui/FileUpload';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import CourseForm from '@/components/CourseForm';
import { ChevronDown, Crown, FileIcon, Sparkles, Trash2, X } from 'lucide-react';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useSubscription } from '@/hooks/useSubscription';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import Link from 'next/link';
import { useFormatters } from '@/hooks/useFormatters';
import AIBreakdownModal from '@/components/AIBreakdownModal';

interface EventDetailModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  workItems?: WorkItem[];
  exams?: Exam[];
  calendarEvents?: CustomCalendarEvent[];
  onEventUpdate?: (updatedEvent: CustomCalendarEvent) => void;
  onStatusChange?: () => void;
  initialBreakdown?: boolean;
  initialEditScope?: 'this' | 'future' | 'all';
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const m = minutes || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m} ${period}`;
}

function formatDateTimeWithTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isDefaultTime = hours === 23 && minutes === 59;

    if (!isDefaultTime) {
      const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateFormatted} at ${timeFormatted}`;
    }

    return dateFormatted;
  } catch {
    return '';
  }
}

export default function EventDetailModal({
  isOpen,
  event: eventProp,
  onClose,
  courses,
  tasks,
  deadlines,
  workItems = [],
  exams = [],
  calendarEvents = [],
  onEventUpdate,
  onStatusChange,
  initialBreakdown,
  initialEditScope,
}: EventDetailModalProps) {
  const isMobile = useIsMobile();
  const subscription = useSubscription();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const courseFormRef = useRef<{ submit: () => void }>(null);
  const { updateTask, updateDeadline, updateCourse, updateCalendarEvent, deleteCalendarEvent, updateWorkItem, toggleWorkItemChecklistItem, settings } = useAppStore();
  const baseColorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');
  // Visual theme takes priority for accent color
  const colorPalette = (() => {
    if (subscription.isPremium && settings.visualTheme && settings.visualTheme !== 'default') {
      const themeColors = getThemeColors(settings.visualTheme, settings.theme || 'dark');
      if (themeColors.accent) {
        return { ...baseColorPalette, accent: themeColors.accent };
      }
    }
    return baseColorPalette;
  })();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editScope, setEditScope] = useState<'this' | 'future' | 'all'>('this');
  const [showEditScopeChoice, setShowEditScopeChoice] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);

  const handleFileClick = (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => {
    setPreviewingFile({ file, allFiles, index });
  };

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditFormData(null);
      setLocalStatus(null);
      setShowDeleteConfirm(false);
      setShowBreakdownModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialBreakdown) {
      setShowBreakdownModal(true);
    }
  }, [isOpen, initialBreakdown]);

  useEffect(() => {
    if (isOpen && initialEditScope && initialEditScope !== 'this' && isRecurringEvent) {
      setEditScope(initialEditScope);
      setShowEditScopeChoice(false);
      beginEditing();
    }
  }, [isOpen, initialEditScope]);

  useEffect(() => {
    if (eventProp && 'status' in eventProp) {
      setLocalStatus(null); // Reset local status when event changes
    }
  }, [eventProp?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          setEditFormData(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const eventAnim = useModalAnimation(isOpen && eventProp ? eventProp : null);
  if (!eventAnim.data) return null;
  const closing = eventAnim.closing;
  const event = eventAnim.data;

  let fullData: Course | Task | Deadline | Exam | CustomCalendarEvent | WorkItem | null = null;
  let relatedCourse: Course | null = null;

  if (event.type === 'course') {
    fullData = courses.find((c) => c.id === event.courseId) || null;
  } else if (event.type === 'task') {
    // For recurring tasks, match both ID and instanceDate to get the correct instance
    // Check both tasks array and workItems (WorkItems with type='task' are stored in workItems)
    if (event.instanceDate) {
      fullData = tasks.find((t) => t.id === event.id && (t as any).instanceDate === event.instanceDate) || null;
      if (!fullData) {
        fullData = workItems.find((w) => w.id === event.id && (w as any).instanceDate === event.instanceDate) || null;
      }
    } else {
      fullData = tasks.find((t) => t.id === event.id) || null;
      if (!fullData) {
        fullData = workItems.find((w) => w.id === event.id) || null;
      }
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Task | WorkItem).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'deadline') {
    // For recurring deadlines, match both ID and instanceDate to get the correct instance
    // Check both deadlines array and workItems (WorkItems with type='assignment' are stored in workItems)
    if (event.instanceDate) {
      fullData = deadlines.find((d) => d.id === event.id && (d as any).instanceDate === event.instanceDate) || null;
      if (!fullData) {
        fullData = workItems.find((w) => w.id === event.id && (w as any).instanceDate === event.instanceDate) || null;
      }
    } else {
      fullData = deadlines.find((d) => d.id === event.id) || null;
      if (!fullData) {
        fullData = workItems.find((w) => w.id === event.id) || null;
      }
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Deadline | WorkItem).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'reading' || event.type === 'project') {
    // WorkItem types: reading and project
    if (event.instanceDate) {
      fullData = workItems.find((w) => w.id === event.id && (w as any).instanceDate === event.instanceDate) || null;
    } else {
      fullData = workItems.find((w) => w.id === event.id) || null;
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as WorkItem).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'exam') {
    // For recurring exams, match both ID and instanceDate to get the correct instance
    if (event.instanceDate) {
      fullData = (exams || []).find((e) => e.id === event.id && (e as any).instanceDate === event.instanceDate) || null;
    } else {
      fullData = (exams || []).find((e) => e.id === event.id) || null;
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Exam).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'event') {
    // Custom calendar event
    fullData = calendarEvents.find((e) => e.id === event.id) || null;
  }

  if (!fullData) return null;

  const getEventTypeColor = () => {
    if (event.type === 'course') return '#3d5fa5';
    if (event.type === 'task') return '#3d7855';
    if (event.type === 'deadline') return '#7d5c52';
    if (event.type === 'reading') return '#0891b2'; // Cyan
    if (event.type === 'project') return '#be185d'; // Pink
    if (event.type === 'exam') return '#c41e3a';
    if (event.type === 'event') return event.color || '#a855f7'; // Purple for custom events
    return '#666';
  };

  const handleEditWithScope = (scope: 'this' | 'future' | 'all') => {
    setEditScope(scope);
    setShowEditScopeChoice(false);
    beginEditing();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditFormData(null);
    } else if (showEditScopeChoice) {
      setShowEditScopeChoice(false);
    } else {
      if (isRecurringEvent) {
        setShowEditScopeChoice(true);
        return;
      }
      beginEditing();
    }
  };

  const beginEditing = () => {
    if (event.type === 'course') {
      const course = fullData as Course;
      router.push(`/courses?edit=${course.id}`);
      onClose();
    } else if (event.type === 'exam') {
      const exam = fullData as Exam;
      router.push(`/exams?edit=${exam.id}`);
      onClose();
    } else {
      setIsEditing(true);
      if (event.type === 'task' && 'checklist' in fullData) {
        const task = fullData as Task;
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
        setEditFormData({
          title: task.title,
          courseId: task.courseId || '',
          dueDate: dateStr,
          dueTime: timeStr,
          notes: task.notes,
          links: task.links && task.links.length > 0 ? task.links : [{ label: '', url: '' }],
          files: task.files || [],
        });
      } else if (event.type === 'deadline') {
        const deadline = fullData as Deadline;
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
        setEditFormData({
          title: deadline.title,
          courseId: deadline.courseId || '',
          dueDate: dateStr,
          dueTime: timeStr,
          notes: deadline.notes,
          links: deadline.links && deadline.links.length > 0 ? deadline.links : [{ label: '', url: '' }],
          files: deadline.files || [],
        });
      } else if (event.type === 'event') {
        const calEvent = fullData as CustomCalendarEvent;
        const startDate = calEvent.startAt ? new Date(calEvent.startAt) : null;
        const endDate = calEvent.endAt ? new Date(calEvent.endAt) : null;
        let dateStr = '';
        let startTimeStr = '';
        let endTimeStr = '';
        if (startDate) {
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const date = String(startDate.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${date}`;
          startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        }
        if (endDate) {
          endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        }
        setEditFormData({
          title: calEvent.title,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          allDay: calEvent.allDay,
          location: calEvent.location || '',
          description: calEvent.description || '',
          color: calEvent.color || '#a855f7',
        });
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !fullData) return;

    try {
      if (event.type === 'task') {
        const task = fullData as Task;
        let dueAt: string | null = null;
        if (editFormData.dueDate && editFormData.dueDate.trim()) {
          const dateTimeString = editFormData.dueTime
            ? `${editFormData.dueDate}T${editFormData.dueTime}`
            : `${editFormData.dueDate}T23:59`;
          const dateObj = new Date(dateTimeString);
          if (dateObj.getTime() > 0) {
            dueAt = dateObj.toISOString();
          }
        }

        const links = editFormData.links
          .filter((l: any) => l.url && l.url.trim())
          .map((l: any) => ({
            label: l.label,
            url: l.url.startsWith('http://') || l.url.startsWith('https://')
              ? l.url
              : `https://${l.url}`,
          }));

        // Always update just this instance (even if it's part of a recurring pattern)
        await updateTask(task.id, {
          title: editFormData.title,
          courseId: editFormData.courseId || null,
          dueAt,
          notes: editFormData.notes,
          links,
          files: editFormData.files || [],
        });
        setIsEditing(false);
        setEditFormData(null);
        // Refresh calendar data to show updated task
        onStatusChange?.();
      } else if (event.type === 'deadline') {
        const deadline = fullData as Deadline;
        let dueAt: string | null = null;
        if (editFormData.dueDate && editFormData.dueDate.trim()) {
          const dateTimeString = editFormData.dueTime
            ? `${editFormData.dueDate}T${editFormData.dueTime}`
            : `${editFormData.dueDate}T23:59`;
          const dateObj = new Date(dateTimeString);
          if (dateObj.getTime() > 0) {
            dueAt = dateObj.toISOString();
          }
        }

        const links = editFormData.links
          .filter((l: any) => l.url && l.url.trim())
          .map((l: any) => ({
            label: l.label,
            url: l.url.startsWith('http://') || l.url.startsWith('https://')
              ? l.url
              : `https://${l.url}`,
          }));

        await updateDeadline(deadline.id, {
          title: editFormData.title,
          courseId: editFormData.courseId || null,
          dueAt,
          notes: editFormData.notes,
          links,
          files: editFormData.files || [],
        });
        setIsEditing(false);
        setEditFormData(null);
        // Refresh calendar data to show updated deadline
        onStatusChange?.();
      } else if (event.type === 'event') {
        const calEvent = fullData as CustomCalendarEvent;

        // Build the common update data
        const buildUpdateData = () => {
          let startAt: string | null = null;
          if (editFormData.date && editFormData.date.trim()) {
            const startDate = new Date(editFormData.date + 'T00:00:00');
            if (!editFormData.allDay && editFormData.startTime) {
              const [hours, minutes] = editFormData.startTime.split(':').map(Number);
              startDate.setHours(hours, minutes, 0, 0);
            } else {
              startDate.setHours(0, 0, 0, 0);
            }
            startAt = startDate.toISOString();
          }

          let endAt: string | null = null;
          if (!editFormData.allDay && editFormData.date && editFormData.endTime) {
            const endDate = new Date(editFormData.date + 'T00:00:00');
            const [endHours, endMinutes] = editFormData.endTime.split(':').map(Number);
            endDate.setHours(endHours, endMinutes, 0, 0);
            endAt = endDate.toISOString();
          }

          return {
            title: editFormData.title,
            description: editFormData.description,
            startAt: startAt || calEvent.startAt,
            endAt,
            allDay: editFormData.allDay,
            location: editFormData.location || null,
            color: editFormData.color,
          };
        };

        const updatedData = buildUpdateData();

        if (calEvent.recurringPatternId && editScope === 'all') {
          // Update the pattern template + all existing instances
          const templateData = {
            title: editFormData.title,
            description: editFormData.description,
            allDay: editFormData.allDay,
            location: editFormData.location || null,
            color: editFormData.color,
            startTime: editFormData.startTime || null,
            endTime: editFormData.endTime || null,
          };
          await fetch(`/api/recurring-calendar-event-patterns/${calEvent.recurringPatternId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventTemplate: templateData }),
          });
          // Update all instances with the shared fields (not date-specific fields)
          const allEvents = useAppStore.getState().calendarEvents;
          const siblingEvents = allEvents.filter(e => e.recurringPatternId === calEvent.recurringPatternId);
          const sharedUpdate = {
            title: editFormData.title,
            description: editFormData.description,
            allDay: editFormData.allDay,
            location: editFormData.location || null,
            color: editFormData.color,
          };
          await Promise.all(siblingEvents.map(e =>
            updateCalendarEvent(e.id, sharedUpdate)
          ));
          await useAppStore.getState().loadFromDatabase();
          onStatusChange?.();
        } else if (calEvent.recurringPatternId && editScope === 'future') {
          // Update this + all future instances with shared fields
          const thisDate = calEvent.startAt ? new Date(calEvent.startAt) : new Date();
          const allEvents = useAppStore.getState().calendarEvents;
          const futureEvents = allEvents.filter(e =>
            e.recurringPatternId === calEvent.recurringPatternId &&
            e.startAt && new Date(e.startAt) >= thisDate
          );
          const sharedUpdate = {
            title: editFormData.title,
            description: editFormData.description,
            allDay: editFormData.allDay,
            location: editFormData.location || null,
            color: editFormData.color,
          };
          await Promise.all(futureEvents.map(e =>
            updateCalendarEvent(e.id, sharedUpdate)
          ));
          await useAppStore.getState().loadFromDatabase();
          onStatusChange?.();
        } else {
          // Edit just this single event
          updateCalendarEvent(calEvent.id, updatedData);
          if (onEventUpdate) {
            onEventUpdate({ ...calEvent, ...updatedData });
          }
        }

        setIsEditing(false);
        setEditFormData(null);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleMarkDoneClick = async () => {
    if (event.type === 'task' && 'status' in fullData) {
      const task = fullData as Task;
      // Use localStatus if set, otherwise use task's status
      const currentStatus = localStatus || task.status;
      const newStatus = currentStatus === 'done' ? 'open' : 'done';
      await updateTask(task.id, {
        status: newStatus,
      });
      // Trigger status change callback and close modal
      onStatusChange?.();
      onClose();
    } else if (event.type === 'deadline' && 'status' in fullData) {
      const deadline = fullData as Deadline;
      // Use localStatus if set, otherwise use deadline's status
      const currentStatus = localStatus || deadline.status;
      const newStatus = currentStatus === 'done' ? 'open' : 'done';
      await updateDeadline(deadline.id, {
        status: newStatus,
      });
      // Trigger status change callback and close modal
      onStatusChange?.();
      onClose();
    }
  };



  const isRecurringEvent = event?.type === 'event' && fullData && (fullData as CustomCalendarEvent).recurringPatternId;

  const handleDeleteEvent = async (mode?: 'this' | 'future' | 'all') => {
    if (event?.type === 'event' && fullData) {
      const calEvent = fullData as CustomCalendarEvent;
      const deleteMode = mode || 'this';
      try {
        if (calEvent.recurringPatternId && deleteMode === 'all') {
          // Delete pattern and all instances via API
          await fetch(`/api/recurring-calendar-event-patterns/${calEvent.recurringPatternId}?deleteInstances=true`, { method: 'DELETE' });
          // Reload store to reflect bulk DB deletions
          await useAppStore.getState().loadFromDatabase();
          onStatusChange?.();
          onClose();
        } else if (calEvent.recurringPatternId && deleteMode === 'future') {
          // Delete this event and all future instances from the same pattern
          const thisDate = calEvent.startAt ? new Date(calEvent.startAt) : new Date();
          // Update the pattern's end date first to stop generating future instances
          await fetch(`/api/recurring-calendar-event-patterns/${calEvent.recurringPatternId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endDate: thisDate.toISOString() }),
          });
          // Bulk delete future instances from DB
          const allEvents = useAppStore.getState().calendarEvents;
          const futureEventIds = allEvents
            .filter(e =>
              e.recurringPatternId === calEvent.recurringPatternId &&
              e.startAt && new Date(e.startAt) >= thisDate
            )
            .map(e => e.id);
          // Delete via individual API calls then reload
          await Promise.all(futureEventIds.map(id =>
            fetch(`/api/calendar-events/${id}`, { method: 'DELETE' })
          ));
          await useAppStore.getState().loadFromDatabase();
          onStatusChange?.();
          onClose();
        } else {
          // Delete just this single event
          await deleteCalendarEvent(calEvent.id);
          onStatusChange?.();
          onClose();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleSaveEditCourse = async (courseData: any) => {
    if (!fullData || event.type !== 'course') return;
    const course = fullData as Course;
    try {
      await updateCourse(course.id, courseData);
      setIsEditing(false);
      setEditFormData(null);
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleSaveClick = () => {
    if (event?.type === 'course') {
      courseFormRef.current?.submit();
    } else {
      handleSaveEdit();
    }
  };

  // Use portal to render modal at document body level to avoid stacking context issues
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 9999 }}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={modalRef}
        className={`${previewStyles.modal} ${closing ? previewStyles.modalClosing : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 12px 8px 12px' : '16px 16px 12px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                marginBottom: isMobile ? '4px' : '8px',
              }}
            >
              {event.type === 'course' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: getEventTypeColor(),
                        color: 'white',
                        padding: isMobile ? '2px 6px' : '4px 8px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      COURSE
                    </div>
                  </div>
                  <h2
                    style={{
                      fontSize: isMobile ? '0.875rem' : '1.125rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      margin: 0,
                    }}
                  >
                    {event.courseCode}: {event.title}
                  </h2>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: getEventTypeColor(),
                        color: 'white',
                        padding: isMobile ? '2px 6px' : '4px 8px',
                        borderRadius: '4px',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {event.type === 'task' ? 'TASK' : event.type === 'deadline' ? 'DEADLINE' : event.type === 'reading' ? 'READING' : event.type === 'project' ? 'PROJECT' : event.type === 'exam' ? 'EXAM' : 'EVENT'}
                    </div>
                  </div>
                  <h2
                    style={{
                      fontSize: isMobile ? '0.875rem' : '1.125rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      margin: 0,
                    }}
                  >
                    {event.title}
                  </h2>
                  {(event.courseCode || (localStatus || (fullData && 'status' in fullData && (fullData as any).status)) === 'done') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {event.courseCode && (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {event.courseCode}
                        </span>
                      )}
                      {(localStatus || (fullData && 'status' in fullData && (fullData as any).status)) === 'done' && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--success)',
                          backgroundColor: 'var(--success-bg)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}>
                          Completed
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className={previewStyles.closeButton}
            style={{ marginLeft: '12px', flexShrink: 0 }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className={previewStyles.content} style={{ overscrollBehavior: 'contain' }}>
          {isEditing ? (
            event.type === 'course' ? (
              <CourseForm
                ref={courseFormRef}
                courseId={(fullData as Course).id}
                onClose={() => setIsEditing(false)}
                hideSubmitButton={true}
                onSave={handleSaveEditCourse}
              />
            ) : event.type === 'event' ? (
              <CalendarEventForm
                formData={editFormData}
                setFormData={setEditFormData}
              />
            ) : (
              <TaskDeadlineForm
                type={event.type as 'task' | 'deadline'}
                formData={editFormData}
                setFormData={setEditFormData}
                courses={courses}
                isPremium={subscription.isPremium}
                onShowUpgradeModal={() => setShowUpgradeModal(true)}
              />
            )
          ) : event.type === 'course' && 'meetingTimes' in fullData ? (
            <CourseContent event={event} course={fullData} />
          ) : event.type === 'task' && 'checklist' in fullData ? (
            <TaskContent task={fullData as Task} relatedCourse={relatedCourse} onToggleChecklistItem={(itemId) => {
              if (workItems.some(w => w.id === event.id)) {
                toggleWorkItemChecklistItem(event.id, itemId);
              } else {
                useAppStore.getState().toggleChecklistItem(event.id, itemId);
              }
            }} onDeleteChecklist={() => {
              if (workItems.some(w => w.id === event.id)) {
                updateWorkItem(event.id, { checklist: [] });
              } else {
                updateTask(event.id, { checklist: [] });
              }
            }} onFileClick={handleFileClick} />
          ) : (event.type === 'reading' || event.type === 'project') && 'type' in fullData ? (
            <WorkItemContent workItem={fullData as WorkItem} relatedCourse={relatedCourse} eventType={event.type} onToggleChecklistItem={(itemId) => toggleWorkItemChecklistItem(event.id, itemId)} onDeleteChecklist={() => {
              updateWorkItem(event.id, { checklist: [] });
            }} onFileClick={handleFileClick} />
          ) : event.type === 'deadline' ? (
            <DeadlineContent deadline={fullData as Deadline} relatedCourse={relatedCourse} onFileClick={handleFileClick} />
          ) : event.type === 'exam' ? (
            <ExamContent exam={fullData as Exam} relatedCourse={relatedCourse} />
          ) : event.type === 'event' ? (
            <CalendarEventContent calendarEvent={fullData as CustomCalendarEvent} />
          ) : null}
        </div>

        {/* Footer - Sticky */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '6px' : '8px',
            padding: isMobile ? '8px 12px 12px' : '12px 16px 16px',
            flexShrink: 0,
          }}
        >
          {isEditing ? (
            <>
              <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={handleEditToggle} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={handleSaveClick}
                style={{ flex: 1 }}
              >
                Save
              </Button>
            </>
          ) : showDeleteConfirm ? (
            isRecurringEvent ? (
              <>
                <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-muted)', width: '100%', marginBottom: '2px' }}>
                  This is a recurring event. What would you like to delete?
                </span>
                <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => handleDeleteEvent('this')}
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                >
                  This Event
                </Button>
                <Button
                  variant="primary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => handleDeleteEvent('future')}
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                >
                  This & Future
                </Button>
                <Button
                  variant="primary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => handleDeleteEvent('all')}
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                >
                  All Events
                </Button>
              </>
            ) : (
              <>
                <span style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--text-muted)', marginRight: 'auto' }}>
                  Delete this event?
                </span>
                <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => handleDeleteEvent('this')}
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Delete
                </Button>
              </>
            )
          ) : showEditScopeChoice ? (
            <>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-muted)', width: '100%', marginBottom: '2px' }}>
                This is a recurring event. What would you like to edit?
              </span>
              <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={() => setShowEditScopeChoice(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleEditWithScope('this')}
                style={{ flex: 1 }}
              >
                This Event
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleEditWithScope('future')}
                style={{ flex: 1 }}
              >
                Future Events
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleEditWithScope('all')}
                style={{ flex: 1 }}
              >
                All Events
              </Button>
            </>
          ) : (
            <>
              {event.type !== 'course' && event.type !== 'exam' && event.type !== 'event' && (
                <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={handleMarkDoneClick} style={{ flex: 1 }}>
                  {(localStatus || (fullData && 'status' in fullData && (fullData as Task | Deadline).status)) === 'done'
                    ? (isMobile ? 'Incomplete' : 'Mark Incomplete')
                    : (isMobile ? 'Complete' : 'Mark Complete')}
                </Button>
              )}
              {event.type !== 'course' && event.type !== 'exam' && event.type !== 'event' && (
                <Button
                  variant="secondary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => setShowBreakdownModal(true)}
                  style={{ flex: 1 }}
                >
                  <Sparkles size={14} />
                  {!isMobile && 'Breakdown'}
                </Button>
              )}
              {event.type === 'event' && (
                <Button
                  variant="secondary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ flex: 1, color: '#ef4444' }}
                >
                  Delete
                </Button>
              )}
              {event.type === 'course' ? (
                <Link href={`/courses?preview=${event.id}`} style={{ flex: 1 }}>
                  <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={onClose}>
                    View Course
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={handleEditToggle}
                  style={{ flex: 1 }}
                >
                  Edit
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Breakdown Modal */}
      {showBreakdownModal && fullData && event && (
        <AIBreakdownModal
          isOpen={true}
          existingTitle={event.title}
          existingDescription={(fullData as any).notes || (fullData as any).description || event.title}
          onClose={() => setShowBreakdownModal(false)}
          onPremiumRequired={() => { setShowBreakdownModal(false); setShowUpgradeModal(true); }}
          onSave={(newItems) => {
            const existing = Array.isArray((fullData as any).checklist) ? (fullData as any).checklist : [];
            const merged = [...newItems, ...existing];
            if (event.type === 'task') {
              if (workItems.some(w => w.id === event.id)) {
                updateWorkItem(event.id, { checklist: merged });
              } else {
                updateTask(event.id, { checklist: merged });
              }
            } else if (event.type === 'deadline') {
              if (workItems.some(w => w.id === event.id)) {
                updateWorkItem(event.id, { checklist: merged });
              } else {
                updateDeadline(event.id, { checklist: merged } as any);
              }
            } else if (event.type === 'reading' || event.type === 'project') {
              updateWorkItem(event.id, { checklist: merged });
            }
          }}
        />
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewingFile?.file ?? null}
        files={previewingFile?.allFiles}
        currentIndex={previewingFile?.index ?? 0}
        onClose={() => setPreviewingFile(null)}
        onNavigate={(file, index) => setPreviewingFile(prev => prev ? { ...prev, file, index } : null)}
      />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--panel-solid, var(--panel))',
                borderRadius: isMobile ? '12px 12px 0 0' : '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxWidth: isMobile ? '100%' : '420px',
                width: isMobile ? '100%' : '100%',
                margin: isMobile ? 0 : '0 16px',
                padding: isMobile ? '24px 20px' : '28px',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colorPalette.accent}30 0%, ${colorPalette.accent}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Crown size={28} style={{ color: 'var(--text)' }} />
              </div>
              <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Keep Everything in One Place
              </h3>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                Attach files directly to your events so everything you need is right where you need it.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Starting at <span style={{ fontWeight: 600, color: 'var(--text)' }}>$3/month</span> or <span style={{ fontWeight: 600, color: 'var(--text)' }}>$10/semester</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/pricing" onClick={() => setShowUpgradeModal(false)}>
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '12px 16px' : '12px 20px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: isMobile ? '14px' : '15px',
                      border: '1px solid var(--border)',
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'var(--accent-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Crown size={18} />
                    Upgrade to Premium
                  </button>
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 16px' : '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '500',
                    fontSize: isMobile ? '13px' : '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255,255,255,0.03)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

// Task/Deadline inline form component
interface TaskDeadlineFormProps {
  type: 'task' | 'deadline';
  formData: any;
  setFormData: (data: any) => void;
  courses: Course[];
  isPremium?: boolean;
  onShowUpgradeModal?: () => void;
}

function TaskDeadlineForm({ formData, setFormData, courses, isPremium, onShowUpgradeModal }: TaskDeadlineFormProps) {
  const isMobile = useIsMobile();
  const { getCourseDisplayName } = useFormatters();
  const [showMore, setShowMore] = useState(false);
  if (!formData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
      {/* Always visible fields */}
      <div>
        <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
          Title
        </p>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', padding: '10px 12px' }}
        />
      </div>

      <div>
        <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
          Course (Optional)
        </p>
        <Select
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          options={[
            { value: '', label: 'None' },
            ...courses.map((c) => ({ value: c.id, label: getCourseDisplayName(c) })),
          ]}
          style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
        />
      </div>

      <div>
        <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
          Due Date
        </p>
        <CalendarPicker
          value={formData.dueDate}
          onChange={(date) => setFormData({ ...formData, dueDate: date })}
        />
      </div>

      <div>
        <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
          Due Time (Optional)
        </p>
        <TimePicker
          value={formData.dueTime}
          onChange={(time) => setFormData({ ...formData, dueTime: time })}
        />
      </div>

      {/* More Options Toggle */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
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
            transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
        More options
      </button>

      {/* More Options Section */}
      {showMore && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
          <div>
            <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
              Notes
            </p>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            />
          </div>

          <div>
            <p style={{ fontSize: isMobile ? '0.75rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 6px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
              Links
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
              {formData.links.map((link: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '6px', paddingBottom: isMobile ? '6px' : '8px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500, ...(isMobile && { paddingLeft: '6px' }) }}>
                    Label
                  </p>
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...formData.links];
                      newLinks[index].label = e.target.value;
                      setFormData({ ...formData, links: newLinks });
                    }}
                    style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', padding: '8px 12px' }}
                  />
                  <p style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500, ...(isMobile && { paddingLeft: '6px' }) }}>
                    URL
                  </p>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...formData.links];
                      newLinks[index].url = e.target.value;
                      setFormData({ ...formData, links: newLinks });
                    }}
                    style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', padding: '8px 12px' }}
                  />
                  <Button
                    variant="secondary"
                    size={isMobile ? 'sm' : 'sm'}
                    onClick={() => {
                      const newLinks = formData.links.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, links: newLinks });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'sm'}
                onClick={() => {
                  setFormData({ ...formData, links: [...formData.links, { label: '', url: '' }] });
                }}
              >
                Add Link
              </Button>
            </div>
          </div>

          <div>
            <p style={{ fontSize: isMobile ? '0.75rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 6px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
              Files
            </p>
            {isPremium ? (
              <FileUpload
                files={formData.files || []}
                onChange={(files) => setFormData({ ...formData, files })}
              />
            ) : (
              <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={onShowUpgradeModal}>
                <Crown size={isMobile ? 14 : 16} />
                Upgrade to Add Files
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar Event edit form component
interface CalendarEventFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const EVENT_COLORS = [
  { value: '#a855f7', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#14b8a6', label: 'Teal' },
];

// Helper to add minutes to a time string
function addMinutesToTime(time: string, minutesToAdd: number): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Calculate duration in minutes between two time strings
function getDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 60; // Default to 1 hour
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const duration = endTotal - startTotal;
  return duration > 0 ? duration : 60;
}

function CalendarEventForm({ formData, setFormData }: CalendarEventFormProps) {
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);
  if (!formData) return null;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{ fontSize: '0.75rem', padding: '10px 12px' }}
        />
        <CalendarPicker label="Date" value={formData.date} onChange={(date) => setFormData({ ...formData, date })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={formData.allDay} onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>All day event</span>
        </label>
        {!formData.allDay && (
          <>
            <TimePicker label="Start Time" value={formData.startTime} onChange={(time) => {
              const duration = getDurationMinutes(formData.startTime, formData.endTime);
              setFormData({ ...formData, startTime: time, endTime: addMinutesToTime(time, duration) });
            }} />
            <TimePicker label="End Time" value={formData.endTime} onChange={(time) => setFormData({ ...formData, endTime: time })} />
          </>
        )}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}
        >
          <ChevronDown size={18} style={{ transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          More options
        </button>
        {showMore && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Location (optional)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Where is it?" />
            <Textarea label="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add details..." />
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Color</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {EVENT_COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c.value, border: formData.color === c.value ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }} title={c.label} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Two-column layout matching AddEventModal
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        style={{ fontSize: '0.875rem', padding: '10px 12px' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '2px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <CalendarPicker label="Date" value={formData.date} onChange={(date) => setFormData({ ...formData, date })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.allDay} onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>All day event</span>
          </label>
          {!formData.allDay && (
            <>
              <TimePicker label="Start Time" value={formData.startTime} onChange={(time) => {
                const duration = getDurationMinutes(formData.startTime, formData.endTime);
                setFormData({ ...formData, startTime: time, endTime: addMinutesToTime(time, duration) });
              }} />
              <TimePicker label="End Time" value={formData.endTime} onChange={(time) => setFormData({ ...formData, endTime: time })} />
            </>
          )}
        </div>
        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Input label="Location (optional)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Where is it?" />
          <Textarea label="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add details..." style={{ minHeight: '90px', height: '90px' }} />
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>Color</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EVENT_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.value, border: formData.color === c.value ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }} title={c.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Display components (unchanged from original)
interface CourseContentProps {
  event: CalendarEvent;
  course: Course;
}

function CourseContent({ event, course }: CourseContentProps) {
  const isMobile = useIsMobile();
  const meetingTime = course.meetingTimes.find(
    (mt) => mt.start === event.time && mt.end === event.endTime
  );

  return (
    <>
      {/* Row 1: Time | Days */}
      {meetingTime && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
          <div className={previewStyles.section}>
            <div className={previewStyles.sectionLabel}>Time</div>
            <div className={previewStyles.sectionValue}>
              {formatTime(meetingTime.start)} - {formatTime(meetingTime.end)}
            </div>
          </div>
          <div className={previewStyles.section}>
            <div className={previewStyles.sectionLabel}>Days</div>
            <div className={previewStyles.sectionValue}>
              {meetingTime.days.join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Location */}
      {meetingTime?.location && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Location</div>
          <div className={previewStyles.sectionValue}>{meetingTime.location}</div>
        </div>
      )}

      {/* Row 3: Links | Files */}
      {((course.links && course.links.length > 0) || (course.files && course.files.length > 0)) && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile || !((course.links?.length ?? 0) > 0 && (course.files?.length ?? 0) > 0) ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
          {course.links && course.links.length > 0 && (
            <div className={previewStyles.section}>
              <div className={previewStyles.sectionLabel}>Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {course.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--link)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      wordBreak: 'break-word',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {course.files && course.files.length > 0 && (
            <div className={previewStyles.section}>
              <div className={previewStyles.sectionLabel}>Files</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {course.files.map((file, index) => (
                  <a
                    key={`${index}-${file.name}`}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.name}
                    style={{
                      color: 'var(--link)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      wordBreak: 'break-word',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {file.name}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      ({file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`})
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface TaskContentProps {
  task: Task;
  relatedCourse: Course | null;
  onToggleChecklistItem?: (itemId: string) => void;
  onDeleteChecklist?: () => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
}

function TaskContent({ task, onToggleChecklistItem, onDeleteChecklist, onFileClick }: TaskContentProps) {
  return (
    <>
      {task.dueAt && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Due</div>
          <div className={previewStyles.sectionValue}>
            {formatDateTimeWithTime(task.dueAt)}
          </div>
        </div>
      )}

      {task.checklist && task.checklist.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.checklistHeader}>
            <span className={previewStyles.checklistCount}>Checklist</span>
            <div className={previewStyles.checklistActions}>
              <button
                onClick={() => onDeleteChecklist?.()}
                title="Delete checklist"
                className={previewStyles.checklistDeleteBtn}
              >
                <Trash2 size={14} />
              </button>
              <span>{task.checklist.filter(i => i.done).length}/{task.checklist.length}</span>
            </div>
          </div>
          <div className={previewStyles.checklistItems}>
            {task.checklist.map((item) => (
              <div
                key={item.id}
                className={previewStyles.checklistItem}
                onClick={() => onToggleChecklistItem?.(item.id)}
              >
                <input type="checkbox" checked={item.done} onChange={() => {}} className={previewStyles.checklistCheckbox} />
                <span className={item.done ? previewStyles.checklistTextDone : previewStyles.checklistText}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.notes && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Notes</div>
          <div className={previewStyles.sectionValuePrewrap}>{task.notes}</div>
        </div>
      )}

      {task.links && task.links.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Links</div>
          <div className={previewStyles.linksList}>
            {task.links.map((link, idx) => (
              <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {task.files && task.files.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Files</div>
          <div className={previewStyles.linksList}>
            {task.files.map((file, index) => (
              <button
                key={`${index}-${file.name}`}
                type="button"
                onClick={() => onFileClick?.(file, task.files!, index)}
                className={previewStyles.fileCard}
              >
                <FileIcon size={14} className={previewStyles.fileIcon} />
                <span className={previewStyles.fileName}>{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface WorkItemContentProps {
  workItem: WorkItem;
  relatedCourse: Course | null;
  eventType: 'reading' | 'project';
  onToggleChecklistItem?: (itemId: string) => void;
  onDeleteChecklist?: () => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
}

function WorkItemContent({ workItem, onToggleChecklistItem, onDeleteChecklist, onFileClick }: WorkItemContentProps) {
  return (
    <>
      {workItem.dueAt && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Due</div>
          <div className={previewStyles.sectionValue}>
            {formatDateTimeWithTime(workItem.dueAt)}
          </div>
        </div>
      )}

      {workItem.checklist && workItem.checklist.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.checklistHeader}>
            <span className={previewStyles.checklistCount}>Checklist</span>
            <div className={previewStyles.checklistActions}>
              <button
                onClick={() => onDeleteChecklist?.()}
                title="Delete checklist"
                className={previewStyles.checklistDeleteBtn}
              >
                <Trash2 size={14} />
              </button>
              <span>{workItem.checklist.filter(i => i.done).length}/{workItem.checklist.length}</span>
            </div>
          </div>
          <div className={previewStyles.checklistItems}>
            {workItem.checklist.map((item) => (
              <div
                key={item.id}
                className={previewStyles.checklistItem}
                onClick={() => onToggleChecklistItem?.(item.id)}
              >
                <input type="checkbox" checked={item.done} onChange={() => {}} className={previewStyles.checklistCheckbox} />
                <span className={item.done ? previewStyles.checklistTextDone : previewStyles.checklistText}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workItem.notes && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Notes</div>
          <div className={previewStyles.sectionValuePrewrap}>{workItem.notes}</div>
        </div>
      )}

      {workItem.links && workItem.links.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Links</div>
          <div className={previewStyles.linksList}>
            {workItem.links.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                {link.label || link.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {workItem.files && workItem.files.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Files</div>
          <div className={previewStyles.linksList}>
            {workItem.files.map((file, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onFileClick?.(file, workItem.files!, idx)}
                className={previewStyles.fileCard}
              >
                <FileIcon size={14} className={previewStyles.fileIcon} />
                <span className={previewStyles.fileName}>{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface DeadlineContentProps {
  deadline: Deadline;
  relatedCourse: Course | null;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
}

function DeadlineContent({ deadline, onFileClick }: DeadlineContentProps) {
  return (
    <>
      {deadline.dueAt && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Due</div>
          <div className={previewStyles.sectionValue}>
            {formatDateTimeWithTime(deadline.dueAt)}
          </div>
        </div>
      )}

      {deadline.notes && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Notes</div>
          <div className={previewStyles.sectionValuePrewrap}>{deadline.notes}</div>
        </div>
      )}

      {deadline.links && deadline.links.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Links</div>
          <div className={previewStyles.linksList}>
            {deadline.links.map((link, idx) => (
              <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {deadline.files && deadline.files.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Files</div>
          <div className={previewStyles.linksList}>
            {deadline.files.map((file, index) => (
              <button
                key={`${index}-${file.name}`}
                type="button"
                onClick={() => onFileClick?.(file, deadline.files!, index)}
                className={previewStyles.fileCard}
              >
                <FileIcon size={14} className={previewStyles.fileIcon} />
                <span className={previewStyles.fileName}>{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface ExamContentProps {
  exam: Exam;
  relatedCourse: Course | null;
}

function ExamContent({ exam }: ExamContentProps) {
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);

  return (
    <>
      {exam.examAt && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Date & Time</div>
          <div className={previewStyles.sectionValue}>
            {formatDateTimeWithTime(exam.examAt)}
          </div>
        </div>
      )}

      {exam.location && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Location</div>
          <div className={previewStyles.sectionValue}>{exam.location}</div>
        </div>
      )}

      {exam.notes && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Notes</div>
          <div className={previewStyles.sectionValuePrewrap}>{exam.notes}</div>
        </div>
      )}

      {exam.links && exam.links.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Links</div>
          <div className={previewStyles.linksList}>
            {exam.links.map((link, idx) => (
              <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {exam.files && exam.files.length > 0 && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Files</div>
          <div className={previewStyles.linksList}>
            {exam.files.map((file, idx) => (
              <button
                key={file.url}
                type="button"
                onClick={() => setPreviewingFile({ file, allFiles: exam.files!, index: idx })}
                className={previewStyles.fileCard}
              >
                <FileIcon size={14} className={previewStyles.fileIcon} />
                <span className={previewStyles.fileName}>{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

interface CalendarEventContentProps {
  calendarEvent: CustomCalendarEvent;
}

function CalendarEventContent({ calendarEvent }: CalendarEventContentProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Row 1: Date | Time */}
      {calendarEvent.startAt && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile || calendarEvent.allDay ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
          <div className={previewStyles.section}>
            <div className={previewStyles.sectionLabel}>Date</div>
            <div className={previewStyles.sectionValue}>
              {new Date(calendarEvent.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          {!calendarEvent.allDay && (
            <div className={previewStyles.section}>
              <div className={previewStyles.sectionLabel}>Time</div>
              <div className={previewStyles.sectionValue}>
                {new Date(calendarEvent.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {calendarEvent.endAt && (
                  <> - {new Date(calendarEvent.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Location */}
      {calendarEvent.location && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Location</div>
          <div className={previewStyles.sectionValue}>{calendarEvent.location}</div>
        </div>
      )}

      {/* Row 3: Description */}
      {calendarEvent.description && (
        <div className={previewStyles.section}>
          <div className={previewStyles.sectionLabel}>Description</div>
          <div className={previewStyles.sectionValuePrewrap}>{calendarEvent.description}</div>
        </div>
      )}
    </>
  );
}
