'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Check, X as XIcon, Sparkles, ExternalLink, Trash2, Edit3 } from 'lucide-react';
import useAppStore from '@/lib/store';
import { CalendarEvent } from '@/lib/calendarUtils';
import { WorkItem, CalendarEvent as CustomCalendarEvent } from '@/types';

interface ContextMenuState {
  event: CalendarEvent;
  x: number;
  y: number;
}

interface UseCalendarContextMenuOptions {
  workItems: WorkItem[];
  setSelectedEvent: (event: CalendarEvent | null) => void;
  onStatusChange?: () => void;
}

export function useCalendarContextMenu({
  workItems,
  setSelectedEvent,
  onStatusChange,
}: UseCalendarContextMenuOptions) {
  const router = useRouter();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [wantsBreakdown, setWantsBreakdown] = useState(false);
  const [pendingEditScope, setPendingEditScope] = useState<'this' | 'future' | 'all'>('this');
  const toggleTaskDone = useAppStore((state) => state.toggleTaskDone);
  const updateDeadline = useAppStore((state) => state.updateDeadline);
  const toggleWorkItemComplete = useAppStore((state) => state.toggleWorkItemComplete);
  const deleteCalendarEvent = useAppStore((state) => state.deleteCalendarEvent);

  const handleContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ event, x, y });
  };

  const getMenuItems = (event: CalendarEvent) => {
    const items: { key: string; label: string; icon: React.ReactNode; danger?: boolean; separator?: boolean }[] = [];
    const type = event.type;
    const isRecurring = event.type === 'event' && !!event.recurringPatternId;

    if (type === 'task' || type === 'deadline' || type === 'reading' || type === 'project') {
      const isCompleted = event.status === 'done' || event.status === 'completed';
      items.push({
        key: 'complete',
        label: isCompleted ? 'Mark Incomplete' : 'Mark Complete',
        icon: isCompleted ? <XIcon size={14} /> : <Check size={14} />,
      });
      items.push({
        key: 'breakdown',
        label: 'AI Breakdown',
        icon: <Sparkles size={14} />,
      });
      items.push({
        key: 'viewInWork',
        label: 'View in Work',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'course') {
      items.push({
        key: 'viewCourse',
        label: 'View Course',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'exam') {
      items.push({
        key: 'viewExam',
        label: 'View in Exams',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'event') {
      if (isRecurring) {
        items.push({
          key: 'openEvent',
          label: 'Edit This Event',
          icon: <Edit3 size={14} />,
        });
        items.push({
          key: 'editFutureEvents',
          label: 'Edit This & Future Events',
          icon: <Edit3 size={14} />,
        });
        items.push({
          key: 'editAllEvents',
          label: 'Edit All Events',
          icon: <Edit3 size={14} />,
        });
        items.push({
          key: 'deleteEventThis',
          label: 'Delete This Event',
          icon: <Trash2 size={14} />,
          danger: true,
          separator: true,
        });
        items.push({
          key: 'deleteEventFuture',
          label: 'Delete This & Future Events',
          icon: <Trash2 size={14} />,
          danger: true,
        });
        items.push({
          key: 'deleteEventAll',
          label: 'Delete All Events',
          icon: <Trash2 size={14} />,
          danger: true,
        });
      } else {
        items.push({
          key: 'deleteEvent',
          label: 'Delete Event',
          icon: <Trash2 size={14} />,
          danger: true,
        });
      }
    }

    return items;
  };

  const handleAction = async (action: string) => {
    if (!contextMenu) return;
    const { event } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case 'complete': {
        const isWorkItem = workItems.some(w => w.id === event.id);
        if (isWorkItem) {
          await toggleWorkItemComplete(event.id);
        } else if (event.type === 'task') {
          await toggleTaskDone(event.id);
        } else if (event.type === 'deadline') {
          const currentStatus = event.status;
          await updateDeadline(event.id, {
            status: currentStatus === 'done' ? 'open' : 'done',
          });
        }
        onStatusChange?.();
        break;
      }
      case 'breakdown':
        setWantsBreakdown(true);
        setSelectedEvent(event);
        break;
      case 'viewInWork':
        router.push(`/work?preview=${event.id}`);
        break;
      case 'viewCourse':
        router.push(`/courses?preview=${event.courseId || event.id}`);
        break;
      case 'viewExam':
        router.push(`/exams?preview=${event.id}`);
        break;
      case 'openEvent':
        setPendingEditScope('this');
        setSelectedEvent(event);
        break;
      case 'editFutureEvents':
        setPendingEditScope('future');
        setSelectedEvent(event);
        break;
      case 'editAllEvents':
        setPendingEditScope('all');
        setSelectedEvent(event);
        break;
      case 'deleteEvent':
      case 'deleteEventThis':
        await deleteCalendarEvent(event.id);
        onStatusChange?.();
        break;
      case 'deleteEventFuture': {
        if (event.recurringPatternId && event.startAt) {
          const thisDate = new Date(event.startAt);
          await fetch(`/api/recurring-calendar-event-patterns/${event.recurringPatternId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endDate: thisDate.toISOString() }),
          });
          const allEvents = useAppStore.getState().calendarEvents;
          const futureEventIds = allEvents
            .filter((e: CustomCalendarEvent) =>
              e.recurringPatternId === event.recurringPatternId &&
              e.startAt && new Date(e.startAt) >= thisDate
            )
            .map((e: CustomCalendarEvent) => e.id);
          await Promise.all(futureEventIds.map(id =>
            fetch(`/api/calendar-events/${id}`, { method: 'DELETE' })
          ));
          await useAppStore.getState().loadFromDatabase();
        }
        onStatusChange?.();
        break;
      }
      case 'deleteEventAll': {
        if (event.recurringPatternId) {
          await fetch(`/api/recurring-calendar-event-patterns/${event.recurringPatternId}?deleteInstances=true`, { method: 'DELETE' });
          await useAppStore.getState().loadFromDatabase();
        } else {
          await deleteCalendarEvent(event.id);
        }
        onStatusChange?.();
        break;
      }
    }
  };

  // Reset wantsBreakdown when modal closes
  const clearBreakdown = () => setWantsBreakdown(false);

  return {
    contextMenu,
    setContextMenu,
    handleContextMenu,
    getMenuItems,
    handleAction,
    wantsBreakdown,
    clearBreakdown,
    pendingEditScope,
  };
}

interface CalendarContextMenuProps {
  contextMenu: ContextMenuState | null;
  setContextMenu: (state: ContextMenuState | null) => void;
  getMenuItems: (event: CalendarEvent) => { key: string; label: string; icon: React.ReactNode; danger?: boolean; separator?: boolean }[];
  handleAction: (action: string) => void;
}

export function CalendarContextMenuPortal({
  contextMenu,
  setContextMenu,
  getMenuItems,
  handleAction,
}: CalendarContextMenuProps) {
  if (!contextMenu) return null;

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={() => setContextMenu(null)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
      />
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          backgroundColor: 'var(--panel-solid, var(--panel))',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
          zIndex: 9999,
          minWidth: '180px',
          padding: '4px 0',
          animation: 'contextMenuIn 100ms ease-out',
        }}
      >
        {getMenuItems(contextMenu.event).map((menuItem) => (
          <React.Fragment key={menuItem.key}>
            {menuItem.separator && (
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
            )}
            <button
              onClick={() => handleAction(menuItem.key)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: menuItem.danger ? 'var(--danger)' : 'var(--text)',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{menuItem.icon}</span>
              {menuItem.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>,
    document.body
  );
}
