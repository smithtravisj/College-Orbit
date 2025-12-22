'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course, Task, Deadline, Exam } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { CalendarEvent } from '@/lib/calendarUtils';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import CourseForm from '@/components/CourseForm';

interface EventDetailModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  exams?: Exam[];
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
  event,
  onClose,
  courses,
  tasks,
  deadlines,
  exams = [],
}: EventDetailModalProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const courseFormRef = useRef<{ submit: () => void }>(null);
  const { updateTask, updateDeadline, updateCourse } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditFormData(null);
      setLocalStatus(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (event && 'status' in event) {
      setLocalStatus(null); // Reset local status when event changes
    }
  }, [event?.id]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isEditing) {
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  let fullData: Course | Task | Deadline | Exam | null = null;
  let relatedCourse: Course | null = null;

  if (event.type === 'course') {
    fullData = courses.find((c) => c.id === event.courseId) || null;
  } else if (event.type === 'task') {
    // For recurring tasks, match both ID and instanceDate to get the correct instance
    if (event.instanceDate) {
      fullData = tasks.find((t) => t.id === event.id && (t as any).instanceDate === event.instanceDate) || null;
    } else {
      fullData = tasks.find((t) => t.id === event.id) || null;
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Task).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'deadline') {
    // For recurring deadlines, match both ID and instanceDate to get the correct instance
    if (event.instanceDate) {
      fullData = deadlines.find((d) => d.id === event.id && (d as any).instanceDate === event.instanceDate) || null;
    } else {
      fullData = deadlines.find((d) => d.id === event.id) || null;
    }
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Deadline).courseId;
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
  }

  if (!fullData) return null;

  const getEventTypeColor = () => {
    if (event.type === 'course') return '#3d5fa5';
    if (event.type === 'task') return '#3d7855';
    if (event.type === 'deadline') return '#7d5c52';
    if (event.type === 'exam') return '#c41e3a';
    return '#666';
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditFormData(null);
    } else {
      if (event.type === 'course') {
        // Navigate to courses page with courseId for editing
        const course = fullData as Course;
        router.push(`/courses?edit=${course.id}`);
        onClose();
      } else if (event.type === 'exam') {
        // Navigate to exams page with examId for editing
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
        });
      }
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
        });
        setIsEditing(false);
        setEditFormData(null);
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
        });
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
      setLocalStatus(newStatus);
      await updateTask(task.id, {
        status: newStatus,
      });
    } else if (event.type === 'deadline' && 'status' in fullData) {
      const deadline = fullData as Deadline;
      // Use localStatus if set, otherwise use deadline's status
      const currentStatus = localStatus || deadline.status;
      const newStatus = currentStatus === 'done' ? 'open' : 'done';
      setLocalStatus(newStatus);
      await updateDeadline(deadline.id, {
        status: newStatus,
      });
    }
  };

  const handleDoneAndClose = () => {
    onClose();
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '450px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 12px 8px 12px' : '24px 24px 16px 24px',
            borderBottom: '1px solid var(--border)',
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
                    {event.type === 'task' ? 'TASK' : event.type === 'deadline' ? 'DEADLINE' : 'EXAM'}
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
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              marginLeft: '12px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
          {isEditing ? (
            event.type === 'course' ? (
              <CourseForm
                ref={courseFormRef}
                courseId={(fullData as Course).id}
                onClose={() => setIsEditing(false)}
                hideSubmitButton={true}
                onSave={handleSaveEditCourse}
              />
            ) : (
              <TaskDeadlineForm
                type={event.type as 'task' | 'deadline'}
                formData={editFormData}
                setFormData={setEditFormData}
                courses={courses}
              />
            )
          ) : event.type === 'course' && 'meetingTimes' in fullData ? (
            <CourseContent event={event} course={fullData} />
          ) : event.type === 'task' && 'checklist' in fullData ? (
            <TaskContent task={fullData} relatedCourse={relatedCourse} />
          ) : event.type === 'deadline' ? (
            <DeadlineContent deadline={fullData as Deadline} relatedCourse={relatedCourse} />
          ) : event.type === 'exam' ? (
            <ExamContent exam={fullData as Exam} relatedCourse={relatedCourse} />
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            justifyContent: 'flex-end',
            padding: isMobile ? '8px 12px' : '16px 24px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {isEditing ? (
            <>
              <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={handleEditToggle}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={handleSaveClick}
                style={{
                  backgroundColor: 'var(--button-secondary)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border)',
                  paddingLeft: isMobile ? '12px' : '16px',
                  paddingRight: isMobile ? '12px' : '16px',
                }}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              {event.type !== 'course' && event.type !== 'exam' && (
                <Button variant="secondary" size={isMobile ? 'sm' : 'md'} onClick={handleMarkDoneClick}>
                  {(localStatus || (fullData && 'status' in fullData && (fullData as Task | Deadline).status)) === 'done'
                    ? 'Mark Incomplete'
                    : 'Mark Complete'}
                </Button>
              )}
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={handleEditToggle}
                style={{
                  backgroundColor: 'var(--button-secondary)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border)',
                  paddingLeft: isMobile ? '12px' : '16px',
                  paddingRight: isMobile ? '12px' : '16px',
                }}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={handleDoneAndClose}
                style={{
                  backgroundColor: 'var(--button-secondary)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border)',
                  paddingLeft: isMobile ? '12px' : '16px',
                  paddingRight: isMobile ? '12px' : '16px',
                }}
              >
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Task/Deadline inline form component
interface TaskDeadlineFormProps {
  type: 'task' | 'deadline';
  formData: any;
  setFormData: (data: any) => void;
  courses: Course[];
}

function TaskDeadlineForm({ formData, setFormData, courses }: TaskDeadlineFormProps) {
  const isMobile = useIsMobile();
  if (!formData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
      <div>
        <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
          Title
        </p>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', ...(isMobile && { paddingLeft: '12px' }) }}
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
            ...courses.map((c) => ({ value: c.id, label: `${c.code}: ${c.name}` })),
          ]}
          style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
            Due Date
          </p>
          <CalendarPicker
            value={formData.dueDate}
            onChange={(date) => setFormData({ ...formData, dueDate: date })}
          />
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0', fontWeight: 600, ...(isMobile && { paddingLeft: '6px' }) }}>
            Due Time (Optional)
          </p>
          <TimePicker
            value={formData.dueTime}
            onChange={(time) => setFormData({ ...formData, dueTime: time })}
          />
        </div>
      </div>

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
                style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
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
                style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>
      <div>
        <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
          Course Name
        </p>
        <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
          {course.name}
        </p>
      </div>

      <div>
        <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
          Term
        </p>
        <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
          {course.term}
        </p>
      </div>

      {meetingTime && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Meeting Time
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {meetingTime.days.join(', ')} {formatTime(meetingTime.start)} -{' '}
            {formatTime(meetingTime.end)}
          </p>
        </div>
      )}

      {meetingTime?.location && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Location
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {meetingTime.location}
          </p>
        </div>
      )}

      {course.links && course.links.length > 0 && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskContentProps {
  task: Task;
  relatedCourse: Course | null;
}

function TaskContent({ task, relatedCourse }: TaskContentProps) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>
      {relatedCourse && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Related Course
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {relatedCourse.code}: {relatedCourse.name}
          </p>
        </div>
      )}

      {task.dueAt && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Due Date
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {formatDateTimeWithTime(task.dueAt)}
          </p>
        </div>
      )}

      {task.notes && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Notes
          </p>
          <p
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'var(--text)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {task.notes}
          </p>
        </div>
      )}

      {task.checklist && task.checklist.length > 0 && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 8px 0' : '0 0 12px 0' }}>
            Checklist
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
            {task.checklist.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '8px' : '10px',
                  cursor: 'pointer',
                  padding: isMobile ? '4px' : '8px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  readOnly
                  style={{
                    width: isMobile ? '14px' : '16px',
                    height: isMobile ? '14px' : '16px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    color: item.done ? 'var(--text-muted)' : 'var(--text)',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}
                >
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {task.links && task.links.length > 0 && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
            {task.links.map((link) => (
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DeadlineContentProps {
  deadline: Deadline;
  relatedCourse: Course | null;
}

function DeadlineContent({ deadline, relatedCourse }: DeadlineContentProps) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>
      {relatedCourse && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Related Course
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {relatedCourse.code}: {relatedCourse.name}
          </p>
        </div>
      )}

      {deadline.dueAt && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Due Date
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {formatDateTimeWithTime(deadline.dueAt)}
          </p>
        </div>
      )}

      {deadline.notes && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Notes
          </p>
          <p
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'var(--text)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {deadline.notes}
          </p>
        </div>
      )}

      {deadline.links && deadline.links.length > 0 && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
            {deadline.links.map((link) => (
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ExamContentProps {
  exam: Exam;
  relatedCourse: Course | null;
}

function ExamContent({ exam, relatedCourse }: ExamContentProps) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px' }}>
      {relatedCourse && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Related Course
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {relatedCourse.code}: {relatedCourse.name}
          </p>
        </div>
      )}

      {exam.examAt && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Exam Date & Time
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {formatDateTimeWithTime(exam.examAt)}
          </p>
        </div>
      )}

      {exam.location && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 2px 0' : '0 0 4px 0' }}>
            Location
          </p>
          <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {exam.location}
          </p>
        </div>
      )}

      {exam.notes && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Notes
          </p>
          <p
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'var(--text)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {exam.notes}
          </p>
        </div>
      )}

      {exam.links && exam.links.length > 0 && (
        <div>
          <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)', margin: isMobile ? '0 0 4px 0' : '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
            {exam.links.map((link) => (
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
