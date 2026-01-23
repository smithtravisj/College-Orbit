'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import useAppStore from '@/lib/store';
import OnboardingTour from '@/components/OnboardingTour';
import { isToday, isOverdue } from '@/lib/utils';
import { useFormatters } from '@/hooks/useFormatters';
import { isDateExcluded } from '@/lib/calendarUtils';
import { getQuickLinks } from '@/lib/quickLinks';
import { DASHBOARD_CARDS, DEFAULT_VISIBLE_DASHBOARD_CARDS } from '@/lib/customizationConstants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { X, FileIcon } from 'lucide-react';
import { CanvasBadge } from '@/components/CanvasBadge';
import LandingPage from '@/components/LandingPage';
import { Timeline } from '@/components/dashboard';
import FilePreviewModal from '@/components/FilePreviewModal';
import { Task, Deadline, Course, Exam, CalendarEvent, WorkItem } from '@/types';

export default function HomePage() {
  const { status } = useSession();

  // Show landing page for unauthenticated users
  if (status === 'loading') {
    return null; // AppLoader handles the loading state
  }

  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const { data: session } = useSession();
  const { formatDate, formatTime, formatTimeString } = useFormatters();
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [previewingTask, setPreviewingTask] = useState<any>(null);
  const [previewingDeadline, setPreviewingDeadline] = useState<any>(null);
  const [previewingWorkItem, setPreviewingWorkItem] = useState<WorkItem | null>(null);
  const [previewingClass, setPreviewingClass] = useState<{ course: any; meetingTime: any } | null>(null);
  const [previewingExam, setPreviewingExam] = useState<any>(null);
  const [previewingEvent, setPreviewingEvent] = useState<any>(null);
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);
  const [, startTransition] = useTransition();

  const [customLinks, setCustomLinks] = useState<Array<{ id: string; label: string; url: string; university: string }>>([]);
  const [timelineHeight, setTimelineHeight] = useState<number>(500);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { courses, deadlines, tasks, settings, excludedDates, initializeStore, toggleTaskDone, updateDeadline, toggleWorkItemComplete } = useAppStore();
  const { isPremium } = useSubscription();
  // Dashboard card visibility is only customizable for premium users - free users see defaults
  const savedVisibleDashboardCards = settings.visibleDashboardCards || DEFAULT_VISIBLE_DASHBOARD_CARDS;
  const visibleDashboardCards = isPremium ? savedVisibleDashboardCards : DEFAULT_VISIBLE_DASHBOARD_CARDS;
  const isMobile = useIsMobile();

  // Handle card collapse state changes and save to database
  const handleCardCollapseChange = (cardId: string, isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== cardId)
      : [...currentCollapsed, cardId];

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
            console.error('[Dashboard] Save failed:', err);
          });
        }
        return res.json();
      })
      .catch(err => console.error('[Dashboard] Failed to save card collapse state:', err));
  };

  useEffect(() => {
    // Only run once on mount - initializeStore has its own guard against re-initialization
    initializeStore().then(() => {
      setMounted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate timeline and quick links height to extend to bottom of viewport
  const isMobileValue = isMobile;
  useEffect(() => {
    const calculateHeights = () => {
      if (isMobileValue) return;
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 24;
        setTimelineHeight(Math.max(300, availableHeight));
      }
    };

    // Use requestAnimationFrame for smoother calculation after layout
    requestAnimationFrame(calculateHeights);
    window.addEventListener('resize', calculateHeights);

    return () => window.removeEventListener('resize', calculateHeights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileValue, mounted]);

  // Fetch custom links when university changes
  useEffect(() => {
    if (mounted && settings.university) {
      // Load from localStorage cache first (prevents hydration mismatch)
      const cached = localStorage.getItem('customQuickLinks');
      if (cached) {
        try {
          setCustomLinks(JSON.parse(cached));
        } catch {
          // Invalid cache, will be replaced by API fetch
        }
      }

      // Then fetch fresh data from API
      console.log('[Dashboard] Fetching custom links for:', settings.university);
      fetch(`/api/custom-quick-links?university=${encodeURIComponent(settings.university)}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log('[Dashboard] Custom links response:', data);
          if (data.links && Array.isArray(data.links)) {
            setCustomLinks(data.links);
            // Cache in localStorage for faster loading
            localStorage.setItem('customQuickLinks', JSON.stringify(data.links));
          }
        })
        .catch(err => console.error('Failed to fetch custom links:', err));
    }
  }, [mounted, settings.university]);

  // Check if user needs onboarding after mount
  // Use userId to verify data has actually loaded (not just defaults)
  const userId = useAppStore((state) => state.userId);
  const storeInitialized = useAppStore((state) => state.initialized);
  useEffect(() => {
    console.log('[Dashboard] Onboarding check:', {
      mounted,
      storeInitialized,
      userId,
      hasCompletedOnboarding: settings.hasCompletedOnboarding,
    });

    // Show onboarding if:
    // 1. Mounted (initializeStore completed)
    // 2. Store is initialized
    // 3. userId is set (confirms API returned actual user data, not just defaults)
    // 4. hasCompletedOnboarding is explicitly false
    if (mounted && storeInitialized && userId && settings.hasCompletedOnboarding === false) {
      // Delay to ensure DOM is fully rendered
      console.log('[Dashboard] Showing onboarding tour');
      setTimeout(() => {
        setShowOnboarding(true);
      }, 800);
    }
  }, [mounted, storeInitialized, userId, settings.hasCompletedOnboarding]);


  // Get due soon items (for Overview card stats)
  // Use dueSoonWindowDays - 1 to match timeline's 7-day window (today + 6 more days)
  const dueSoon = deadlines
    .filter((d) => {
      if (!d.dueAt) return false;
      const dueDate = new Date(d.dueAt);
      const windowEnd = new Date();
      windowEnd.setHours(23, 59, 59, 999); // End of today
      windowEnd.setDate(windowEnd.getDate() + (settings.dueSoonWindowDays - 1));
      return dueDate <= windowEnd && d.status === 'open';
    })
    .sort((a, b) => {
      if (!a.dueAt || !b.dueAt) return 0;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

  // Get today's tasks (for Overview card stats)
  const todayTasks = tasks
    .filter((t) => t.dueAt && (isToday(t.dueAt) || isOverdue(t.dueAt)) && t.status === 'open')
    .sort((a, b) => {
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  // Helper function to check if a course is active on a specific date
  const isCourseCurrent = (course: any, checkDate?: Date) => {
    const dateToCheck = checkDate ? new Date(checkDate) : new Date();
    const dateStr = dateToCheck.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (course.startDate) {
      const startStr = course.startDate.split('T')[0]; // Handle both timestamp and date string formats
      if (startStr > dateStr) return false; // Course hasn't started
    }

    if (course.endDate) {
      const endStr = course.endDate.split('T')[0]; // Handle both timestamp and date string formats
      if (endStr < dateStr) return false; // Course has ended (endDate is before this date)
    }

    // Check if date is excluded
    if (isDateExcluded(dateToCheck, course.id, excludedDates)) {
      return false;
    }

    return true;
  };

  // Get next class
  const today = new Date();
  const todayClasses = courses
    .filter((course) => isCourseCurrent(course))
    .flatMap((course) =>
      (course.meetingTimes || [])
        .filter((mt) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return mt.days?.includes(days[today.getDay()]) || false;
        })
        .map((mt) => ({
          ...mt,
          courseCode: course.code,
          courseName: course.name,
          courseLinks: course.links,
        }))
    );

  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const overdueTasks = tasks.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open');

  // Get quick links - filter out hidden ones and add custom links
  const hiddenLinksForUniversity = settings.university && settings.hiddenQuickLinks
    ? (settings.hiddenQuickLinks[settings.university] || [])
    : [];
  const defaultQuickLinks = getQuickLinks(settings.university).filter(
    link => !hiddenLinksForUniversity.includes(link.label)
  );
  const universityCustomLinks = customLinks.filter(link => link.university === settings.university);
  const quickLinks = [...defaultQuickLinks, ...universityCustomLinks];

  // Status summary
  const classesLeft = todayClasses.filter((c) => c.end > nowTime).length;
  const overdueCount = overdueTasks.length + deadlines.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open').length;

  // Helper function to render card with appropriate component based on device
  const renderCard = (cardId: string, title: string, children: React.ReactNode, className?: string, subtitle?: string, variant: 'primary' | 'secondary' = 'primary') => {
    // Check if card is collapsed in database
    const isCollapsed = (settings.dashboardCardsCollapsedState || []).includes(cardId);

    if (isMobile) {
      // On mobile, remove h-full height constraint to prevent layout issues when collapsing
      const mobileClassName = className?.replace(/h-full/g, '').trim() || '';
      return (
        <CollapsibleCard
          id={cardId}
          title={title}
          subtitle={subtitle}
          className={mobileClassName}
          initialOpen={!isCollapsed}
          onChange={(isOpen) => handleCardCollapseChange(cardId, isOpen)}
          variant={variant}
        >
          {children}
        </CollapsibleCard>
      );
    }

    return (
      <Card title={title} className={className} variant={variant}>
        {children}
      </Card>
    );
  };

  return (
    <>
      <OnboardingTour
        shouldRun={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Dashboard Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: isMobile ? '26px' : '34px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}. Here's the plan for today.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[1400px] flex flex-col" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        {isMobile ? (
          // Mobile: Stack cards vertically
          <div className="flex flex-col" style={{ gap: '16px' }}>
            {/* Timeline Card */}
            {visibleDashboardCards.includes(DASHBOARD_CARDS.TIMELINE) && (
              <div data-tour="timeline">
                {renderCard(
                  DASHBOARD_CARDS.TIMELINE,
                  'Timeline',
                  <Timeline
                    onTaskClick={(task: Task) => startTransition(() => setPreviewingTask(task))}
                    onDeadlineClick={(deadline: Deadline) => startTransition(() => setPreviewingDeadline(deadline))}
                    onWorkItemClick={(workItem: WorkItem) => startTransition(() => setPreviewingWorkItem(workItem))}
                    onClassClick={(course: Course, meetingTime: any) => startTransition(() => setPreviewingClass({ course, meetingTime }))}
                    onExamClick={(exam: Exam) => startTransition(() => setPreviewingExam(exam))}
                    onEventClick={(event: CalendarEvent) => startTransition(() => setPreviewingEvent(event))}
                    onFileClick={(file, allFiles, index) => setPreviewingFile({ file, allFiles, index })}
                    defaultRange="today"
                    showProgress={true}
                    showRangeToggle={true}
                    maxHeight={350}
                  />,
                  'flex flex-col',
                  'Your schedule and tasks'
                )}
              </div>
            )}

            {/* Overview */}
            {visibleDashboardCards.includes(DASHBOARD_CARDS.OVERVIEW) && (
              <div className="animate-fade-in-up" data-tour="overview">
                {renderCard(
                  DASHBOARD_CARDS.OVERVIEW,
                  'Overview',
                  <div className="space-y-0">
                    <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                      <div className="text-sm text-[var(--muted)] leading-relaxed">Classes remaining</div>
                      <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: classesLeft > 0 ? 700 : 500, marginRight: '8px' }}>{classesLeft}</div>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                      <div className="text-sm text-[var(--muted)] leading-relaxed">Due soon</div>
                      <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: dueSoon.length > 0 ? 700 : 500, marginRight: '8px' }}>{dueSoon.length}</div>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                      <div className="text-sm text-[var(--muted)] leading-relaxed">Overdue</div>
                      <div className="text-base tabular-nums" style={{ fontWeight: overdueCount > 0 ? 700 : 500, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text)', marginRight: '8px' }}>{overdueCount}</div>
                    </div>
                    <div className="flex items-center justify-between" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                      <div className="text-sm text-[var(--muted)] leading-relaxed">Tasks today</div>
                      <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: todayTasks.length > 0 ? 700 : 500, marginRight: '8px' }}>{todayTasks.length}</div>
                    </div>
                  </div>,
                  'flex flex-col'
                )}
              </div>
            )}

            {/* Quick Links */}
            {visibleDashboardCards.includes(DASHBOARD_CARDS.QUICK_LINKS) && (
              <div className="animate-fade-in-up">
                {renderCard(
                  DASHBOARD_CARDS.QUICK_LINKS,
                  'Quick Links',
                  <>
                    {settings.university ? (
                      <div className="grid grid-cols-2 gap-2">
                        {quickLinks.map((link: { id?: string; label: string; url: string }) => (
                          <a
                            key={link.id || link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-[12px] text-center text-sm font-medium transition-colors hover:opacity-80"
                            style={{ display: 'block', padding: '8px', backgroundColor: settings.theme === 'light' ? 'var(--panel)' : 'var(--panel-2)', color: 'var(--text)', border: '2px solid var(--border)' }}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Quick Links"
                        description="Go to settings to select a university to add quick links."
                        action={{
                          label: "Go to Settings",
                          onClick: () => window.location.href = '/settings'
                        }}
                      />
                    )}
                  </>,
                  'flex flex-col w-full',
                  settings.university ? `Resources for ${settings.university}` : 'Select a college to view quick links'
                )}
              </div>
            )}
          </div>
        ) : (
          // Desktop: Two-column layout - timeline extends to bottom of viewport
          <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
            {/* Column 1: Timeline (extends to bottom of viewport) */}
            {visibleDashboardCards.includes(DASHBOARD_CARDS.TIMELINE) && (
              <div ref={timelineRef} className="flex-1" data-tour="timeline" style={{ height: `${timelineHeight}px` }}>
                {renderCard(
                  DASHBOARD_CARDS.TIMELINE,
                  'Timeline',
                  <Timeline
                    onTaskClick={(task: Task) => startTransition(() => setPreviewingTask(task))}
                    onDeadlineClick={(deadline: Deadline) => startTransition(() => setPreviewingDeadline(deadline))}
                    onWorkItemClick={(workItem: WorkItem) => startTransition(() => setPreviewingWorkItem(workItem))}
                    onClassClick={(course: Course, meetingTime: any) => startTransition(() => setPreviewingClass({ course, meetingTime }))}
                    onExamClick={(exam: Exam) => startTransition(() => setPreviewingExam(exam))}
                    onEventClick={(event: CalendarEvent) => startTransition(() => setPreviewingEvent(event))}
                    onFileClick={(file, allFiles, index) => setPreviewingFile({ file, allFiles, index })}
                    defaultRange="today"
                    showProgress={true}
                    showRangeToggle={true}
                  />,
                  'flex flex-col h-full',
                  'Your schedule and tasks'
                )}
              </div>
            )}

            {/* Column 2: Overview and Quick Links stacked */}
            <div className="flex flex-col gap-6" style={{ width: '320px', flexShrink: 0, height: `${timelineHeight}px` }}>
              {/* Overview */}
              {visibleDashboardCards.includes(DASHBOARD_CARDS.OVERVIEW) && (
                <div className="animate-fade-in-up" data-tour="overview">
                  {renderCard(
                    DASHBOARD_CARDS.OVERVIEW,
                    'Overview',
                    <div className="space-y-0">
                      <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                        <div className="text-sm text-[var(--muted)] leading-relaxed">Classes remaining</div>
                        <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: classesLeft > 0 ? 700 : 500, marginRight: '8px' }}>{classesLeft}</div>
                      </div>
                      <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                        <div className="text-sm text-[var(--muted)] leading-relaxed">Due soon</div>
                        <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: dueSoon.length > 0 ? 700 : 500, marginRight: '8px' }}>{dueSoon.length}</div>
                      </div>
                      <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                        <div className="text-sm text-[var(--muted)] leading-relaxed">Overdue</div>
                        <div className="text-base tabular-nums" style={{ fontWeight: overdueCount > 0 ? 700 : 500, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text)', marginRight: '8px' }}>{overdueCount}</div>
                      </div>
                      <div className="flex items-center justify-between" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                        <div className="text-sm text-[var(--muted)] leading-relaxed">Tasks today</div>
                        <div className="text-base tabular-nums text-[var(--text)]" style={{ fontWeight: todayTasks.length > 0 ? 700 : 500, marginRight: '8px' }}>{todayTasks.length}</div>
                      </div>
                    </div>,
                    'flex flex-col'
                  )}
                </div>
              )}

              {/* Quick Links */}
              {visibleDashboardCards.includes(DASHBOARD_CARDS.QUICK_LINKS) && (
                <div className="animate-fade-in-up flex-1 min-h-0 flex flex-col">
                  {renderCard(
                    DASHBOARD_CARDS.QUICK_LINKS,
                    'Quick Links',
                    <>
                      {settings.university ? (
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1" style={{ alignContent: 'start' }}>
                          {quickLinks.map((link: { id?: string; label: string; url: string }) => (
                            <a
                              key={link.id || link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-[12px] text-center text-sm font-medium transition-colors hover:opacity-80"
                              style={{ display: 'block', padding: '12px', backgroundColor: settings.theme === 'light' ? 'var(--panel)' : 'var(--panel-2)', color: 'var(--text)', border: '2px solid var(--border)' }}
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="Quick Links"
                          description="Go to settings to select a university to add quick links."
                          action={{
                            label: "Go to Settings",
                            onClick: () => window.location.href = '/settings'
                          }}
                        />
                      )}
                    </>,
                    'flex flex-col h-full w-full',
                    settings.university ? `Resources for ${settings.university}` : 'Select a college to view quick links'
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Preview Modal */}
      {previewingTask && (
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
          onClick={() => setPreviewingTask(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              backgroundColor: 'var(--panel)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  margin: 0,
                  wordBreak: 'break-word',
                }}>
                  {previewingTask.title}
                </h2>
                {previewingTask.courseId && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {courses.find(c => c.id === previewingTask.courseId)?.code || courses.find(c => c.id === previewingTask.courseId)?.name}
                  </div>
                )}
              </div>
              <button
                onClick={() => setPreviewingTask(null)}
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

            {/* Content - Scrollable */}
            <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', flex: 1, overflowY: 'auto' }}>
              {/* Status */}
              {previewingTask.status === 'done' && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  marginBottom: '10px',
                  display: 'inline-block',
                }}>
                  Completed
                </span>
              )}

              {/* Due Date */}
              {previewingTask.dueAt && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Due</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {formatDate(previewingTask.dueAt)}
                    {' '}
                    {new Date(previewingTask.dueAt).getHours() !== 23 && formatTime(previewingTask.dueAt)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {previewingTask.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {previewingTask.notes}
                  </div>
                </div>
              )}

              {/* Links */}
              {previewingTask.links && previewingTask.links.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingTask.links.map((link: any, idx: number) => (
                      <a
                        key={`${link.url}-${idx}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '14px', color: 'var(--link)' }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {previewingTask.files && previewingTask.files.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingTask.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingTask.files, index: idx })}
                        style={{ fontSize: '14px', color: 'var(--link)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileIcon size={14} style={{ flexShrink: 0 }} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Sticky */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
              backgroundColor: 'var(--panel)',
            }}>
              <Button
                variant="secondary"
                onClick={() => {
                  // Check if this is a WorkItem (has type field) vs legacy Task
                  const isWorkItem = previewingTask.type && ['task', 'assignment', 'reading', 'project'].includes(previewingTask.type);
                  if (isWorkItem) {
                    toggleWorkItemComplete(previewingTask.id);
                  } else {
                    toggleTaskDone(previewingTask.id);
                  }
                  setPreviewingTask(null);
                }}
                style={{ flex: 1 }}
              >
                {previewingTask.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Link href={`/work?preview=${previewingTask.id}`} style={{ flex: 1 }}>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPreviewingTask(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Preview Modal */}
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
              overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              backgroundColor: 'var(--panel)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}>
                    {previewingDeadline.title}
                  </h2>
                  {previewingDeadline.canvasAssignmentId && <CanvasBadge />}
                </div>
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

            {/* Content - Scrollable */}
            <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', flex: 1, overflowY: 'auto' }}>
              {/* Status */}
              {previewingDeadline.status === 'done' && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  marginBottom: '10px',
                  display: 'inline-block',
                }}>
                  Completed
                </span>
              )}

              {/* Due Date */}
              {previewingDeadline.dueAt && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Due</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {formatDate(previewingDeadline.dueAt)}
                    {' '}
                    {new Date(previewingDeadline.dueAt).getHours() !== 23 && formatTime(previewingDeadline.dueAt)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {previewingDeadline.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {previewingDeadline.notes}
                  </div>
                </div>
              )}

              {/* Links */}
              {previewingDeadline.links && previewingDeadline.links.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingDeadline.links.map((link: any, idx: number) => (
                      <a
                        key={`${link.url}-${idx}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '14px', color: 'var(--link)' }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {previewingDeadline.files && previewingDeadline.files.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingDeadline.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingDeadline.files, index: idx })}
                        style={{ fontSize: '14px', color: 'var(--link)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileIcon size={14} style={{ flexShrink: 0 }} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Sticky */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
              backgroundColor: 'var(--panel)',
            }}>
              <Button
                variant="secondary"
                onClick={() => {
                  // Check if this is a WorkItem (has type='assignment') vs legacy Deadline
                  const isWorkItem = previewingDeadline.type === 'assignment';
                  if (isWorkItem) {
                    toggleWorkItemComplete(previewingDeadline.id);
                  } else {
                    updateDeadline(previewingDeadline.id, {
                      status: previewingDeadline.status === 'done' ? 'open' : 'done',
                    });
                  }
                  setPreviewingDeadline(null);
                }}
                style={{ flex: 1 }}
              >
                {previewingDeadline.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Link href={`/work?preview=${previewingDeadline.id}`} style={{ flex: 1 }}>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPreviewingDeadline(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WorkItem Preview Modal (for readings and projects) */}
      {previewingWorkItem && (
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
          onClick={() => setPreviewingWorkItem(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              width: isMobile ? '100%' : '400px',
              maxHeight: isMobile ? '80vh' : '70vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: isMobile ? '12px' : '16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.125rem', color: 'var(--text)' }}>
                    {previewingWorkItem.title}
                  </h3>
                </div>
                {previewingWorkItem.courseId && (
                  <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--text-muted)' }}>
                    {courses.find(c => c.id === previewingWorkItem.courseId)?.code || courses.find(c => c.id === previewingWorkItem.courseId)?.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewingWorkItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: isMobile ? '12px' : '16px' }}>
              {/* Type Badge */}
              <div style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: previewingWorkItem.type === 'reading' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                    color: previewingWorkItem.type === 'reading' ? '#06b6d4' : '#ec4899',
                    textTransform: 'capitalize',
                  }}
                >
                  {previewingWorkItem.type}
                </span>
              </div>

              {previewingWorkItem.status === 'done' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--success)',
                    marginBottom: '12px',
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                  Completed
                </div>
              )}

              {previewingWorkItem.dueAt && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Due: </span>
                  <span style={{ color: 'var(--text)', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                    {formatDate(previewingWorkItem.dueAt)}
                    {new Date(previewingWorkItem.dueAt).getHours() !== 23 && ` at ${formatTime(previewingWorkItem.dueAt)}`}
                  </span>
                </div>
              )}

              {previewingWorkItem.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: 'var(--text)', fontSize: isMobile ? '0.75rem' : '0.875rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {previewingWorkItem.notes}
                  </p>
                </div>
              )}

              {previewingWorkItem.links && previewingWorkItem.links.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Links:</p>
                  {previewingWorkItem.links.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', color: 'var(--link)', fontSize: isMobile ? '0.75rem' : '0.875rem', marginBottom: '4px' }}
                    >
                      {link.label || link.url}
                    </a>
                  ))}
                </div>
              )}

              {previewingWorkItem.files && previewingWorkItem.files.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Files:</p>
                  {previewingWorkItem.files.map((file: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewingFile({ file, allFiles: previewingWorkItem.files, index: idx })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--link)',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        marginBottom: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <FileIcon size={14} />
                      {file.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '12px' : '16px', borderTop: '1px solid var(--border)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  toggleWorkItemComplete(previewingWorkItem.id);
                  setPreviewingWorkItem(null);
                }}
                style={{ flex: 1 }}
              >
                {previewingWorkItem.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Link href={`/work?preview=${previewingWorkItem.id}`} style={{ flex: 1 }}>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPreviewingWorkItem(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Class Preview Modal */}
      {previewingClass && (
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
          onClick={() => setPreviewingClass(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  {previewingClass.course.name || previewingClass.course.code}
                </h2>
                {previewingClass.course.code && previewingClass.course.name && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {previewingClass.course.code}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingClass(null)} style={{ padding: '4px', color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', flex: 1, overflowY: 'auto' }}>
              {previewingClass.meetingTime && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Time</div>
                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                      {formatTimeString(previewingClass.meetingTime.start)} – {formatTimeString(previewingClass.meetingTime.end)}
                    </div>
                  </div>
                  {previewingClass.meetingTime.location && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Location</div>
                      <div style={{ fontSize: '14px', color: 'var(--text)' }}>{previewingClass.meetingTime.location}</div>
                    </div>
                  )}
                  {previewingClass.meetingTime.days && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Days</div>
                      <div style={{ fontSize: '14px', color: 'var(--text)' }}>{previewingClass.meetingTime.days.join(', ')}</div>
                    </div>
                  )}
                </>
              )}
              {previewingClass.course.instructor && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Instructor</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>{previewingClass.course.instructor}</div>
                </div>
              )}
              {previewingClass.course.links && previewingClass.course.links.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingClass.course.links.map((link: { label: string; url: string }, idx: number) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--link)] hover:underline">
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {previewingClass.course.files && previewingClass.course.files.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingClass.course.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingClass.course.files, index: idx })}
                        style={{ fontSize: '14px', color: 'var(--link)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileIcon size={14} style={{ flexShrink: 0 }} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '10px 12px' : '12px 16px', borderTop: '1px solid var(--border)' }}>
              <Link href={`/courses?preview=${previewingClass.course.id}`} style={{ flex: 1 }}>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPreviewingClass(null)}>
                  View Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Exam Preview Modal */}
      {previewingExam && (
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
          onClick={() => setPreviewingExam(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  {previewingExam.title}
                </h2>
                {previewingExam.courseId && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {courses.find(c => c.id === previewingExam.courseId)?.code || courses.find(c => c.id === previewingExam.courseId)?.name}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingExam(null)} style={{ padding: '4px', color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', flex: 1, overflowY: 'auto' }}>
              {previewingExam.examAt && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Date & Time</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {formatDate(previewingExam.examAt)} {formatTime(previewingExam.examAt)}
                  </div>
                </div>
              )}
              {previewingExam.location && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Location</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>{previewingExam.location}</div>
                </div>
              )}
              {previewingExam.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{previewingExam.notes}</div>
                </div>
              )}
              {previewingExam.links && previewingExam.links.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingExam.links.map((link: { label: string; url: string }, idx: number) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--link)] hover:underline">
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {previewingExam.files && previewingExam.files.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Files</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {previewingExam.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingExam.files, index: idx })}
                        style={{ fontSize: '14px', color: 'var(--link)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileIcon size={14} style={{ flexShrink: 0 }} />
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '10px 12px' : '12px 16px', borderTop: '1px solid var(--border)' }}>
              <Link href={`/exams?preview=${previewingExam.id}`} style={{ flex: 1 }}>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPreviewingExam(null)}>
                  View in Exams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Event Preview Modal */}
      {previewingEvent && (
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
          onClick={() => setPreviewingEvent(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  {previewingEvent.title}
                </h2>
              </div>
              <button onClick={() => setPreviewingEvent(null)} style={{ padding: '4px', color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', flex: 1, overflowY: 'auto' }}>
              {previewingEvent.startAt && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {previewingEvent.allDay ? 'Date' : 'Date & Time'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    {formatDate(previewingEvent.startAt)}
                    {!previewingEvent.allDay && (
                      <> {formatTime(previewingEvent.startAt)}</>
                    )}
                    {previewingEvent.endAt && !previewingEvent.allDay && (
                      <> – {formatTime(previewingEvent.endAt)}</>
                    )}
                  </div>
                </div>
              )}
              {previewingEvent.location && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Location</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>{previewingEvent.location}</div>
                </div>
              )}
              {previewingEvent.description && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Description</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{previewingEvent.description}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '10px 12px' : '12px 16px', borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setPreviewingEvent(null)}>
                Close
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
