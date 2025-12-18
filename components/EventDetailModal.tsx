'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Course, Task, Deadline } from '@/types';
import { CalendarEvent } from '@/lib/calendarUtils';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';

interface EventDetailModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
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

    // Check if time is meaningful (not 11:59 PM which is default)
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
}: EventDetailModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const { updateTask, updateDeadline, toggleChecklistItem } = useAppStore();

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  // Find the full data for the event
  let fullData: Course | Task | Deadline | null = null;
  let relatedCourse: Course | null = null;

  if (event.type === 'course') {
    fullData = courses.find((c) => c.id === event.courseId) || null;
  } else if (event.type === 'task') {
    fullData = tasks.find((t) => t.id === event.id) || null;
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Task).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  } else if (event.type === 'deadline') {
    fullData = deadlines.find((d) => d.id === event.id) || null;
    if (fullData && 'courseId' in fullData && fullData.courseId) {
      const courseId = (fullData as Deadline).courseId;
      relatedCourse = courses.find((c) => c.id === courseId) || null;
    }
  }

  if (!fullData) return null;

  const getEventTypeColor = () => {
    if (event.type === 'course') return '#3d5fa5';
    if (event.type === 'task') return '#3d7855';
    if (event.type === 'deadline') return '#7d5c52';
    return '#666';
  };

  const handleEditClick = () => {
    if (event.type === 'task') {
      router.push('/tasks');
      onClose();
    } else if (event.type === 'deadline') {
      router.push('/deadlines');
      onClose();
    } else if (event.type === 'course') {
      router.push('/courses');
      onClose();
    }
  };

  const handleMarkDoneClick = async () => {
    if (event.type === 'task' && 'id' in fullData) {
      const task = fullData as Task;
      await updateTask(task.id, {
        status: task.status === 'done' ? 'open' : 'done',
      });
    } else if (event.type === 'deadline' && 'id' in fullData) {
      const deadline = fullData as Deadline;
      await updateDeadline(deadline.id, {
        status: deadline.status === 'done' ? 'open' : 'done',
      });
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    if (event.type === 'task' && 'id' in fullData) {
      const task = fullData as Task;
      await toggleChecklistItem(task.id, itemId);
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
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              {event.type === 'course' ? (
                <>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: getEventTypeColor(),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    COURSE
                  </div>
                  <h2
                    style={{
                      fontSize: '1.125rem',
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
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {event.type === 'task' ? 'TASK' : 'DEADLINE'}
                  </div>
                  <h2
                    style={{
                      fontSize: '1.125rem',
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

          {/* Close button */}
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
        <div style={{ padding: '24px' }}>
          {event.type === 'course' && 'meetingTimes' in fullData ? (
            <CourseContent event={event} course={fullData} />
          ) : event.type === 'task' && 'checklist' in fullData ? (
            <TaskContent
              task={fullData}
              relatedCourse={relatedCourse}
              onChecklistToggle={handleChecklistToggle}
            />
          ) : event.type === 'deadline' ? (
            <DeadlineContent
              deadline={fullData as Deadline}
              relatedCourse={relatedCourse}
            />
          ) : null}
        </div>

        {/* Footer with action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {event.type !== 'course' && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleMarkDoneClick}
            >
              {fullData && 'status' in fullData && (fullData as Task | Deadline).status === 'done'
                ? 'Mark Open'
                : 'Mark Done'}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleEditClick}
            style={{
              backgroundColor: '#132343',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#132343',
            }}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CourseContentProps {
  event: CalendarEvent;
  course: Course;
}

function CourseContent({ event, course }: CourseContentProps) {
  const meetingTime = course.meetingTimes.find(
    (mt) => mt.start === event.time && mt.end === event.endTime
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Course Name */}
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
          Course Name
        </p>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
          {course.name}
        </p>
      </div>

      {/* Term */}
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
          Term
        </p>
        <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
          {course.term}
        </p>
      </div>

      {/* Meeting Time */}
      {meetingTime && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Meeting Time
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {meetingTime.days.join(', ')} {formatTime(meetingTime.start)} -{' '}
            {formatTime(meetingTime.end)}
          </p>
        </div>
      )}

      {/* Location */}
      {meetingTime?.location && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Location
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {meetingTime.location}
          </p>
        </div>
      )}

      {/* Links */}
      {course.links && course.links.length > 0 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {course.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent)',
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
  onChecklistToggle: (itemId: string) => void;
}

function TaskContent({
  task,
  relatedCourse,
  onChecklistToggle,
}: TaskContentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Related Course */}
      {relatedCourse && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Related Course
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {relatedCourse.code}: {relatedCourse.name}
          </p>
        </div>
      )}

      {/* Due Date */}
      {task.dueAt && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Due Date
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {formatDateTimeWithTime(task.dueAt)}
          </p>
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Notes
          </p>
          <p
            style={{
              fontSize: '0.875rem',
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

      {/* Checklist */}
      {task.checklist && task.checklist.length > 0 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Checklist
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {task.checklist.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '8px',
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
                  onChange={() => onChecklistToggle(item.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
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

      {/* Links */}
      {task.links && task.links.length > 0 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {task.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent)',
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Related Course */}
      {relatedCourse && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Related Course
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {relatedCourse.code}: {relatedCourse.name}
          </p>
        </div>
      )}

      {/* Due Date */}
      {deadline.dueAt && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Due Date
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
            {formatDateTimeWithTime(deadline.dueAt)}
          </p>
        </div>
      )}

      {/* Notes */}
      {deadline.notes && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Notes
          </p>
          <p
            style={{
              fontSize: '0.875rem',
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

      {/* Links */}
      {deadline.links && deadline.links.length > 0 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deadline.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent)',
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
