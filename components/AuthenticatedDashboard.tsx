'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useTransition } from 'react';
import useAppStore from '@/lib/store';
import OnboardingTour from '@/components/OnboardingTour';
import { useHighlightElement } from '@/hooks/useHighlightElement';
import { useFormatters } from '@/hooks/useFormatters';
import { getQuickLinks } from '@/lib/quickLinks';
import { DASHBOARD_CARDS, DEFAULT_VISIBLE_DASHBOARD_CARDS } from '@/lib/customizationConstants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import previewStyles from '@/components/ItemPreviewModal.module.css';
import { X, FileIcon, Sparkles, Trash2 } from 'lucide-react';
import { CanvasBadge } from '@/components/CanvasBadge';
import { CanvasExtBadge } from '@/components/CanvasExtBadge';
import { LearningSuiteBadge } from '@/components/LearningSuiteBadge';
import { Timeline } from '@/components/dashboard';
import FilePreviewModal from '@/components/FilePreviewModal';
import { Task, Deadline, Course, Exam, CalendarEvent, WorkItem } from '@/types';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import { StreakCard } from '@/components/gamification';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import DemoBanner from '@/components/DemoBanner';
import AIBreakdownModal from '@/components/AIBreakdownModal';
import CollegeSelectionModal from '@/components/CollegeSelectionModal';
import dynamic from 'next/dynamic';
import { CalendarEvent as InternalCalendarEvent } from '@/lib/calendarUtils';
import { useModalAnimation } from '@/hooks/useModalAnimation';

const EventDetailModal = dynamic(() => import('@/components/EventDetailModal'), { ssr: false });

export default function AuthenticatedDashboard() {
  const { data: session } = useSession();
  const { formatDate, formatTime, formatTimeString } = useFormatters();
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCollegeSelection, setShowCollegeSelection] = useState(false);
  const [previewingTask, setPreviewingTask] = useState<any>(null);
  const [previewingDeadline, setPreviewingDeadline] = useState<any>(null);
  const [previewingWorkItem, setPreviewingWorkItem] = useState<WorkItem | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [previewingClass, setPreviewingClass] = useState<{ course: any; meetingTime: any } | null>(null);
  const [previewingExam, setPreviewingExam] = useState<any>(null);
  const [previewingEvent, setPreviewingEvent] = useState<any>(null);
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);
  const [, startTransition] = useTransition();

  // Animated modal wrappers — delay unmount so exit animation plays
  const taskAnim = useModalAnimation(previewingTask);
  const deadlineAnim = useModalAnimation(previewingDeadline);
  const workItemAnim = useModalAnimation(previewingWorkItem);
  const classAnim = useModalAnimation(previewingClass);
  const examAnim = useModalAnimation(previewingExam);

  const handleTimelineBreakdown = (item: TimelineItemType) => {
    const type = item.type;
    if (type === 'task') {
      setPreviewingTask(item.originalItem as Task);
      setTimeout(() => setShowBreakdownModal(true), 50);
    } else if (type === 'deadline') {
      setPreviewingDeadline(item.originalItem as Deadline);
      setTimeout(() => setShowBreakdownModal(true), 50);
    } else if (type === 'reading' || type === 'project') {
      setPreviewingWorkItem(item.originalItem as WorkItem);
      setTimeout(() => setShowBreakdownModal(true), 50);
    }
  };

  const [customLinks, setCustomLinks] = useState<Array<{ id: string; label: string; url: string; university: string }>>([]);
  const [timelineHeight, setTimelineHeight] = useState<number>(500);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { courses, tasks, deadlines, workItems, exams, calendarEvents, settings, toggleTaskDone, updateDeadline, toggleWorkItemComplete, updateWorkItem, toggleWorkItemChecklistItem, gamification, fetchGamification } = useAppStore();
  const { isPremium } = useSubscription();
  const savedVisibleDashboardCards = settings.visibleDashboardCards || DEFAULT_VISIBLE_DASHBOARD_CARDS;
  const visibleDashboardCards = isPremium ? savedVisibleDashboardCards : DEFAULT_VISIBLE_DASHBOARD_CARDS;
  const isMobile = useIsMobile();

  // Handle scroll-to and highlight from global search
  useHighlightElement();

  const handleCardCollapseChange = (cardId: string, isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== cardId)
      : [...currentCollapsed, cardId];

    useAppStore.setState((state) => ({
      settings: {
        ...state.settings,
        dashboardCardsCollapsedState: newCollapsed,
      },
    }));

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
    setMounted(true);
  }, []);

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

    requestAnimationFrame(calculateHeights);
    window.addEventListener('resize', calculateHeights);

    return () => window.removeEventListener('resize', calculateHeights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileValue, mounted]);

  useEffect(() => {
    if (mounted && settings.university) {
      const cached = localStorage.getItem('customQuickLinks');
      if (cached) {
        try {
          setCustomLinks(JSON.parse(cached));
        } catch {
          // Invalid cache, will be replaced by API fetch
        }
      }

      console.log('[Dashboard] Fetching custom links for:', settings.university);
      fetch(`/api/custom-quick-links?university=${encodeURIComponent(settings.university)}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log('[Dashboard] Custom links response:', data);
          if (data.links && Array.isArray(data.links)) {
            setCustomLinks(data.links);
            localStorage.setItem('customQuickLinks', JSON.stringify(data.links));
          }
        })
        .catch(err => console.error('Failed to fetch custom links:', err));
    }
  }, [mounted, settings.university]);

  useEffect(() => {
    if (mounted) {
      fetchGamification();
    }
  }, [mounted, fetchGamification]);

  const userId = useAppStore((state) => state.userId);
  const storeInitialized = useAppStore((state) => state.initialized);
  useEffect(() => {
    console.log('[Dashboard] Onboarding check:', {
      mounted,
      storeInitialized,
      userId,
      hasCompletedOnboarding: settings.hasCompletedOnboarding,
    });

    if (mounted && storeInitialized && userId && settings.hasCompletedOnboarding === false) {
      console.log('[Dashboard] Showing onboarding tour');
      setTimeout(() => {
        setShowOnboarding(true);
      }, 800);
    } else if (mounted && storeInitialized && userId && settings.hasCompletedOnboarding && settings.needsCollegeSelection) {
      // OAuth user who completed onboarding but hasn't selected a college yet (e.g. page refresh)
      setTimeout(() => {
        setShowCollegeSelection(true);
      }, 800);
    }
  }, [mounted, storeInitialized, userId, settings.hasCompletedOnboarding, settings.needsCollegeSelection]);

  const hiddenLinksForUniversity = settings.university && settings.hiddenQuickLinks
    ? (settings.hiddenQuickLinks[settings.university] || [])
    : [];
  const defaultQuickLinks = getQuickLinks(settings.university).filter(
    link => !hiddenLinksForUniversity.includes(link.label)
  );
  const universityCustomLinks = customLinks.filter(link => link.university === settings.university);
  const quickLinks = [...defaultQuickLinks, ...universityCustomLinks];

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <Skeleton width={180} height={isMobile ? 26 : 34} borderRadius={6} style={{ marginBottom: 6 }} />
        <Skeleton width={280} height={14} borderRadius={4} style={{ marginBottom: 24 }} />
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <SkeletonCard lines={8} />
            </div>
            <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <SkeletonCard lines={4} />
              <SkeletonCard lines={3} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderCard = (cardId: string, title: string, children: React.ReactNode, className?: string, subtitle?: string, variant: 'primary' | 'secondary' = 'primary') => {
    const isCollapsed = (settings.dashboardCardsCollapsedState || []).includes(cardId);

    if (isMobile) {
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
      <div id={cardId} className="h-full flex flex-col">
        <Card title={title} className={className} variant={variant}>
          {children}
        </Card>
      </div>
    );
  };

  return (
    <>
      <OnboardingTour
        shouldRun={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          if (settings.needsCollegeSelection) {
            setTimeout(() => setShowCollegeSelection(true), 400);
          }
        }}
      />
      {showCollegeSelection && (
        <CollegeSelectionModal onClose={() => setShowCollegeSelection(false)} />
      )}

      {/* Dashboard Header */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
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
          {isPremium && settings.visualTheme === 'cartoon'
            ? `Hey${session?.user?.name ? ` ${session.user.name.split(' ')[0]}` : ''}! Let's make today count.`
            : `Welcome back${session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}. Here's the plan for today.`}
        </p>
      </div>

      <div className="mx-auto w-full max-w-[1800px] flex flex-col" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        {settings.hasDemoData && <DemoBanner />}
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
                    onBreakdown={handleTimelineBreakdown}
                    defaultRange={settings.hasDemoData ? "week" : "today"}
                    showProgress={true}
                    showRangeToggle={true}
                    maxHeight={350}
                  />,
                  'flex flex-col',
                  'Your schedule and tasks'
                )}
              </div>
            )}

            {/* Progress / Gamification */}
            {visibleDashboardCards.includes(DASHBOARD_CARDS.PROGRESS) && (
              <div className="animate-fade-in-up">
                <StreakCard data={gamification} loading={!gamification} />
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
                    onBreakdown={handleTimelineBreakdown}
                    defaultRange={settings.hasDemoData ? "week" : "today"}
                    showProgress={true}
                    showRangeToggle={true}
                  />,
                  'flex flex-col h-full',
                  'Your schedule and tasks'
                )}
              </div>
            )}

            {/* Column 2: Progress and Quick Links stacked */}
            <div className="flex flex-col gap-6" style={{ width: '320px', flexShrink: 0, height: `${timelineHeight}px` }}>
              {/* Progress / Gamification */}
              {visibleDashboardCards.includes(DASHBOARD_CARDS.PROGRESS) && (
                <div className="animate-fade-in-up flex-1 min-h-0 flex flex-col">
                  <StreakCard data={gamification} loading={!gamification} />
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
      {taskAnim.data && (() => { const previewingTask = taskAnim.data!; return (
        <div className={taskAnim.closing ? previewStyles.backdropClosing : previewStyles.backdrop} onClick={() => setPreviewingTask(null)}>
          <div className={`${previewStyles.modal} ${taskAnim.closing ? previewStyles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={previewStyles.header}>
              <div className={previewStyles.headerInfo}>
                <h2 className={previewStyles.title}>{previewingTask.title}</h2>
                {(previewingTask.courseId || previewingTask.status === 'done' || previewingTask.workingOn) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {previewingTask.courseId && (
                      <span className={previewStyles.subtitle} style={{ margin: 0 }}>
                        {courses.find(c => c.id === previewingTask.courseId)?.code || courses.find(c => c.id === previewingTask.courseId)?.name}
                      </span>
                    )}
                    {previewingTask.status === 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Completed</span>
                    )}
                    {previewingTask.workingOn && previewingTask.status !== 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Working On</span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingTask(null)} className={previewStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div className={previewStyles.content}>

              {previewingTask.dueAt && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Due</div>
                  <div className={previewStyles.sectionValue}>
                    {formatDate(previewingTask.dueAt)}{' '}
                    {new Date(previewingTask.dueAt).getHours() !== 23 && formatTime(previewingTask.dueAt)}
                  </div>
                </div>
              )}

              {previewingTask.checklist && previewingTask.checklist.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.checklistHeader}>
                    <span className={previewStyles.checklistCount}>Checklist</span>
                    <div className={previewStyles.checklistActions}>
                      <button
                        onClick={() => {
                          const isWI = previewingTask.type && ['task', 'assignment', 'reading', 'project'].includes(previewingTask.type);
                          if (isWI) {
                            updateWorkItem(previewingTask.id, { checklist: [] });
                          } else {
                            useAppStore.getState().updateTask(previewingTask.id, { checklist: [] });
                          }
                          setPreviewingTask((prev: any) => prev ? { ...prev, checklist: [] } : prev);
                        }}
                        title="Delete checklist"
                        className={previewStyles.checklistDeleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                      <span>{previewingTask.checklist.filter((i: any) => i.done).length}/{previewingTask.checklist.length}</span>
                    </div>
                  </div>
                  <div className={previewStyles.checklistItems}>
                    {previewingTask.checklist.map((item: any) => (
                      <div
                        key={item.id}
                        className={previewStyles.checklistItem}
                        onClick={() => {
                          const isWI = previewingTask.type && ['task', 'assignment', 'reading', 'project'].includes(previewingTask.type);
                          if (isWI) {
                            toggleWorkItemChecklistItem(previewingTask.id, item.id);
                          } else {
                            useAppStore.getState().toggleChecklistItem(previewingTask.id, item.id);
                          }
                          setPreviewingTask((prev: any) => prev ? {
                            ...prev,
                            checklist: prev.checklist.map((ci: any) => ci.id === item.id ? { ...ci, done: !ci.done } : ci),
                          } : prev);
                        }}
                      >
                        <input type="checkbox" checked={item.done} onChange={() => {}} className={previewStyles.checklistCheckbox} />
                        <span className={item.done ? previewStyles.checklistTextDone : previewStyles.checklistText}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewingTask.notes && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Notes</div>
                  <div className={previewStyles.sectionValuePrewrap}>{previewingTask.notes}</div>
                </div>
              )}

              {previewingTask.tags && previewingTask.tags.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Tags</div>
                  <div className={previewStyles.tags}>
                    {previewingTask.tags.map((tag: string) => (
                      <span key={tag} className={previewStyles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {previewingTask.links && previewingTask.links.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Links</div>
                  <div className={previewStyles.linksList}>
                    {previewingTask.links.map((link: any, idx: number) => (
                      <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {previewingTask.files && previewingTask.files.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Files</div>
                  <div className={previewStyles.linksList}>
                    {previewingTask.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingTask.files, index: idx })}
                        className={previewStyles.fileCard}
                      >
                        <FileIcon size={14} className={previewStyles.fileIcon} />
                        <span className={previewStyles.fileName}>{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={previewStyles.footer}>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => {
                  const isWorkItem = previewingTask.type && ['task', 'assignment', 'reading', 'project'].includes(previewingTask.type);
                  if (isWorkItem) {
                    toggleWorkItemComplete(previewingTask.id);
                  } else {
                    toggleTaskDone(previewingTask.id);
                  }
                  setPreviewingTask(null);
                }}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                {previewingTask.status === 'done' ? 'Incomplete' : 'Complete'}
              </Button>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => setShowBreakdownModal(true)}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                <Sparkles size={isMobile ? 14 : 16} />
                Breakdown
              </Button>
              <Link href={`/work?preview=${previewingTask.id}`} style={{ flex: isMobile ? undefined : 1 }}>
                <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={() => setPreviewingTask(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ); })()}

      {/* Breakdown Modal for Tasks */}
      {showBreakdownModal && previewingTask && (
        <AIBreakdownModal
          isOpen={true}
          existingTitle={previewingTask.title}
          existingDescription={previewingTask.notes || previewingTask.title}
          onClose={() => setShowBreakdownModal(false)}
          onPremiumRequired={() => setShowBreakdownModal(false)}
          onSave={(newItems) => {
            const existing = Array.isArray(previewingTask.checklist) ? previewingTask.checklist : [];
            const merged = [...newItems, ...existing];
            const isWI = previewingTask.type && ['task', 'assignment', 'reading', 'project'].includes(previewingTask.type);
            if (isWI) {
              updateWorkItem(previewingTask.id, { checklist: merged });
            } else {
              useAppStore.getState().updateTask(previewingTask.id, { checklist: merged });
            }
            setPreviewingTask((prev: any) => prev ? { ...prev, checklist: merged } : prev);
          }}
        />
      )}

      {/* Deadline Preview Modal */}
      {deadlineAnim.data && (() => { const previewingDeadline = deadlineAnim.data!; return (
        <div className={deadlineAnim.closing ? previewStyles.backdropClosing : previewStyles.backdrop} onClick={() => setPreviewingDeadline(null)}>
          <div className={`${previewStyles.modal} ${deadlineAnim.closing ? previewStyles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={previewStyles.header}>
              <div className={previewStyles.headerInfo}>
                <h2 className={previewStyles.title}>
                  {previewingDeadline.title}
                  {previewingDeadline.canvasAssignmentId && <>{' '}<CanvasBadge /></>}
                  {!previewingDeadline.canvasAssignmentId && ((previewingDeadline as any).links || []).some((l: any) => l.label === 'Canvas') && <>{' '}<CanvasExtBadge /></>}
                  {((previewingDeadline as any).links || []).some((l: any) => l.label === 'Learning Suite') && <>{' '}<LearningSuiteBadge /></>}
                </h2>
                {(previewingDeadline.courseId || previewingDeadline.status === 'done' || (previewingDeadline as any).workingOn) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {previewingDeadline.courseId && (
                      <span className={previewStyles.subtitle} style={{ margin: 0 }}>
                        {courses.find(c => c.id === previewingDeadline.courseId)?.code || courses.find(c => c.id === previewingDeadline.courseId)?.name}
                      </span>
                    )}
                    {previewingDeadline.status === 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Completed</span>
                    )}
                    {(previewingDeadline as any).workingOn && previewingDeadline.status !== 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Working On</span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingDeadline(null)} className={previewStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div className={previewStyles.content}>

              {previewingDeadline.dueAt && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Due</div>
                  <div className={previewStyles.sectionValue}>
                    {formatDate(previewingDeadline.dueAt)}{' '}
                    {new Date(previewingDeadline.dueAt).getHours() !== 23 && formatTime(previewingDeadline.dueAt)}
                  </div>
                </div>
              )}

              {previewingDeadline.checklist && previewingDeadline.checklist.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.checklistHeader}>
                    <span className={previewStyles.checklistCount}>Checklist</span>
                    <div className={previewStyles.checklistActions}>
                      <button
                        onClick={() => {
                          const isWI = previewingDeadline.type === 'assignment';
                          if (isWI) {
                            updateWorkItem(previewingDeadline.id, { checklist: [] });
                          } else {
                            updateDeadline(previewingDeadline.id, { checklist: [] } as any);
                          }
                          setPreviewingDeadline((prev: any) => prev ? { ...prev, checklist: [] } : prev);
                        }}
                        title="Delete checklist"
                        className={previewStyles.checklistDeleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                      <span>{previewingDeadline.checklist.filter((i: any) => i.done).length}/{previewingDeadline.checklist.length}</span>
                    </div>
                  </div>
                  <div className={previewStyles.checklistItems}>
                    {previewingDeadline.checklist.map((item: any) => (
                      <div
                        key={item.id}
                        className={previewStyles.checklistItem}
                        onClick={() => {
                          const isWI = previewingDeadline.type === 'assignment';
                          if (isWI) {
                            toggleWorkItemChecklistItem(previewingDeadline.id, item.id);
                          } else {
                            useAppStore.getState().toggleChecklistItem(previewingDeadline.id, item.id);
                          }
                          setPreviewingDeadline((prev: any) => prev ? {
                            ...prev,
                            checklist: prev.checklist.map((ci: any) => ci.id === item.id ? { ...ci, done: !ci.done } : ci),
                          } : prev);
                        }}
                      >
                        <input type="checkbox" checked={item.done} onChange={() => {}} className={previewStyles.checklistCheckbox} />
                        <span className={item.done ? previewStyles.checklistTextDone : previewStyles.checklistText}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewingDeadline.notes && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Notes</div>
                  <div className={previewStyles.sectionValuePrewrap}>{previewingDeadline.notes}</div>
                </div>
              )}

              {previewingDeadline.tags && previewingDeadline.tags.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Tags</div>
                  <div className={previewStyles.tags}>
                    {previewingDeadline.tags.map((tag: string) => (
                      <span key={tag} className={previewStyles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {previewingDeadline.links && previewingDeadline.links.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Links</div>
                  <div className={previewStyles.linksList}>
                    {previewingDeadline.links.map((link: any, idx: number) => (
                      <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {previewingDeadline.files && previewingDeadline.files.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Files</div>
                  <div className={previewStyles.linksList}>
                    {previewingDeadline.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingDeadline.files, index: idx })}
                        className={previewStyles.fileCard}
                      >
                        <FileIcon size={14} className={previewStyles.fileIcon} />
                        <span className={previewStyles.fileName}>{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={previewStyles.footer}>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => {
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
                style={{ flex: isMobile ? undefined : 1 }}
              >
                {previewingDeadline.status === 'done' ? 'Incomplete' : 'Complete'}
              </Button>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => setShowBreakdownModal(true)}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                <Sparkles size={isMobile ? 14 : 16} />
                Breakdown
              </Button>
              <Link href={`/work?preview=${previewingDeadline.id}`} style={{ flex: isMobile ? undefined : 1 }}>
                <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={() => setPreviewingDeadline(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ); })()}

      {/* Breakdown Modal for Deadlines */}
      {showBreakdownModal && previewingDeadline && (
        <AIBreakdownModal
          isOpen={true}
          existingTitle={previewingDeadline.title}
          existingDescription={previewingDeadline.notes || previewingDeadline.title}
          onClose={() => setShowBreakdownModal(false)}
          onPremiumRequired={() => setShowBreakdownModal(false)}
          onSave={(newItems) => {
            const existing = Array.isArray(previewingDeadline.checklist) ? previewingDeadline.checklist : [];
            const merged = [...newItems, ...existing];
            const isWI = previewingDeadline.type === 'assignment';
            if (isWI) {
              updateWorkItem(previewingDeadline.id, { checklist: merged });
            } else {
              updateDeadline(previewingDeadline.id, { checklist: merged } as any);
            }
            setPreviewingDeadline((prev: any) => prev ? { ...prev, checklist: merged } : prev);
          }}
        />
      )}

      {/* WorkItem Preview Modal (for readings and projects) */}
      {workItemAnim.data && (() => { const previewingWorkItem = workItemAnim.data!; return (
        <div className={workItemAnim.closing ? previewStyles.backdropClosing : previewStyles.backdrop} onClick={() => setPreviewingWorkItem(null)}>
          <div className={`${previewStyles.modal} ${workItemAnim.closing ? previewStyles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={previewStyles.header}>
              <div className={previewStyles.headerInfo}>
                <h2 className={previewStyles.title}>{previewingWorkItem.title}</h2>
                {(previewingWorkItem.courseId || previewingWorkItem.status === 'done' || previewingWorkItem.workingOn) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {previewingWorkItem.courseId && (
                      <span className={previewStyles.subtitle} style={{ margin: 0 }}>
                        {courses.find(c => c.id === previewingWorkItem.courseId)?.code || courses.find(c => c.id === previewingWorkItem.courseId)?.name}
                      </span>
                    )}
                    {previewingWorkItem.status === 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Completed</span>
                    )}
                    {previewingWorkItem.workingOn && previewingWorkItem.status !== 'done' && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '2px 8px', borderRadius: '999px' }}>Working On</span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingWorkItem(null)} className={previewStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div className={previewStyles.content}>
              <div className={previewStyles.badges}>
                <span
                  className={previewStyles.badge}
                  style={{
                    backgroundColor: previewingWorkItem.type === 'reading' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                    color: previewingWorkItem.type === 'reading' ? '#06b6d4' : '#ec4899',
                    textTransform: 'capitalize',
                  }}
                >
                  {previewingWorkItem.type}
                </span>
              </div>

              {previewingWorkItem.dueAt && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Due</div>
                  <div className={previewStyles.sectionValue}>
                    {formatDate(previewingWorkItem.dueAt)}
                    {new Date(previewingWorkItem.dueAt).getHours() !== 23 && ` at ${formatTime(previewingWorkItem.dueAt)}`}
                  </div>
                </div>
              )}

              {previewingWorkItem.checklist && previewingWorkItem.checklist.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.checklistHeader}>
                    <span className={previewStyles.checklistCount}>Checklist</span>
                    <div className={previewStyles.checklistActions}>
                      <button
                        onClick={() => {
                          updateWorkItem(previewingWorkItem.id, { checklist: [] });
                          setPreviewingWorkItem(prev => prev ? { ...prev, checklist: [] } : prev);
                        }}
                        title="Delete checklist"
                        className={previewStyles.checklistDeleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                      <span>{previewingWorkItem.checklist.filter(i => i.done).length}/{previewingWorkItem.checklist.length}</span>
                    </div>
                  </div>
                  <div className={previewStyles.checklistItems}>
                    {previewingWorkItem.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={previewStyles.checklistItem}
                        onClick={() => {
                          toggleWorkItemChecklistItem(previewingWorkItem.id, item.id);
                          setPreviewingWorkItem(prev => prev ? {
                            ...prev,
                            checklist: prev.checklist.map(ci => ci.id === item.id ? { ...ci, done: !ci.done } : ci),
                          } : prev);
                        }}
                      >
                        <input type="checkbox" checked={item.done} onChange={() => {}} className={previewStyles.checklistCheckbox} />
                        <span className={item.done ? previewStyles.checklistTextDone : previewStyles.checklistText}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewingWorkItem.notes && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Notes</div>
                  <div className={previewStyles.sectionValuePrewrap}>{previewingWorkItem.notes}</div>
                </div>
              )}

              {previewingWorkItem.tags && previewingWorkItem.tags.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Tags</div>
                  <div className={previewStyles.tags}>
                    {previewingWorkItem.tags.map((tag: string) => (
                      <span key={tag} className={previewStyles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {previewingWorkItem.links && previewingWorkItem.links.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Links</div>
                  <div className={previewStyles.linksList}>
                    {previewingWorkItem.links.map((link: any, idx: number) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {previewingWorkItem.files && previewingWorkItem.files.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Files</div>
                  <div className={previewStyles.linksList}>
                    {previewingWorkItem.files.map((file: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewingFile({ file, allFiles: previewingWorkItem.files, index: idx })}
                        className={previewStyles.fileCard}
                      >
                        <FileIcon size={14} className={previewStyles.fileIcon} />
                        <span className={previewStyles.fileName}>{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={previewStyles.footer}>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => {
                  toggleWorkItemComplete(previewingWorkItem.id);
                  setPreviewingWorkItem(null);
                }}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                {previewingWorkItem.status === 'done' ? 'Incomplete' : 'Complete'}
              </Button>
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => setShowBreakdownModal(true)}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                <Sparkles size={isMobile ? 14 : 16} />
                Breakdown
              </Button>
              <Link href={`/work?preview=${previewingWorkItem.id}`} style={{ flex: isMobile ? undefined : 1 }}>
                <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={() => setPreviewingWorkItem(null)}>
                  View in Work
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ); })()}

      {/* Breakdown Modal for WorkItems */}
      {showBreakdownModal && previewingWorkItem && (
        <AIBreakdownModal
          isOpen={true}
          existingTitle={previewingWorkItem.title}
          existingDescription={previewingWorkItem.notes || previewingWorkItem.title}
          onClose={() => setShowBreakdownModal(false)}
          onPremiumRequired={() => setShowBreakdownModal(false)}
          onSave={(newItems) => {
            const existing = Array.isArray(previewingWorkItem.checklist) ? previewingWorkItem.checklist : [];
            const merged = [...newItems, ...existing];
            updateWorkItem(previewingWorkItem.id, { checklist: merged });
            setPreviewingWorkItem(prev => prev ? { ...prev, checklist: merged } : prev);
          }}
        />
      )}

      {/* Class Preview Modal */}
      {classAnim.data && (() => { const previewingClass = classAnim.data!; return (
        <div className={classAnim.closing ? previewStyles.backdropClosing : previewStyles.backdrop} onClick={() => setPreviewingClass(null)}>
          <div className={`${previewStyles.modal} ${classAnim.closing ? previewStyles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={previewStyles.header}>
              <div className={previewStyles.headerInfo}>
                <h2 className={previewStyles.title}>
                  {previewingClass.course.name || previewingClass.course.code}
                </h2>
                {previewingClass.course.code && previewingClass.course.name && (
                  <div className={previewStyles.subtitle}>{previewingClass.course.code}</div>
                )}
              </div>
              <button onClick={() => setPreviewingClass(null)} className={previewStyles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <div className={previewStyles.content}>
              {/* Row 1: Time | Days */}
              {previewingClass.meetingTime && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile || !previewingClass.meetingTime.days ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
                  <div className={previewStyles.section}>
                    <div className={previewStyles.sectionLabel}>Time</div>
                    <div className={previewStyles.sectionValue}>
                      {formatTimeString(previewingClass.meetingTime.start)} – {formatTimeString(previewingClass.meetingTime.end)}
                    </div>
                  </div>
                  {previewingClass.meetingTime.days && (
                    <div className={previewStyles.section}>
                      <div className={previewStyles.sectionLabel}>Days</div>
                      <div className={previewStyles.sectionValue}>{previewingClass.meetingTime.days.join(', ')}</div>
                    </div>
                  )}
                </div>
              )}
              {/* Row 2: Location */}
              {previewingClass.meetingTime?.location && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Location</div>
                  <div className={previewStyles.sectionValue}>{previewingClass.meetingTime.location}</div>
                </div>
              )}
              {previewingClass.course.instructor && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Instructor</div>
                  <div className={previewStyles.sectionValue}>{previewingClass.course.instructor}</div>
                </div>
              )}
              {/* Row 3: Links | Files */}
              {((previewingClass.course.links && previewingClass.course.links.length > 0) || (previewingClass.course.files && previewingClass.course.files.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile || !(previewingClass.course.links?.length > 0 && previewingClass.course.files?.length > 0) ? '1fr' : '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
                  {previewingClass.course.links && previewingClass.course.links.length > 0 && (
                    <div className={previewStyles.section}>
                      <div className={previewStyles.sectionLabel}>Links</div>
                      <div className={previewStyles.linksList}>
                        {previewingClass.course.links.map((link: { label: string; url: string }, idx: number) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewingClass.course.files && previewingClass.course.files.length > 0 && (
                    <div className={previewStyles.section}>
                      <div className={previewStyles.sectionLabel}>Files</div>
                      <div className={previewStyles.linksList}>
                        {previewingClass.course.files.map((file: any, idx: number) => (
                          <button
                            key={`${file.url}-${idx}`}
                            type="button"
                            onClick={() => setPreviewingFile({ file, allFiles: previewingClass.course.files, index: idx })}
                            className={previewStyles.fileCard}
                          >
                            <FileIcon size={14} className={previewStyles.fileIcon} />
                            <span className={previewStyles.fileName}>{file.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={previewStyles.footer}>
              <Link href={`/courses?preview=${previewingClass.course.id}`} style={{ flex: 1 }}>
                <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={() => setPreviewingClass(null)}>
                  View Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ); })()}

      {/* Exam Preview Modal */}
      {examAnim.data && (() => { const previewingExam = examAnim.data!; return (
        <div className={examAnim.closing ? previewStyles.backdropClosing : previewStyles.backdrop} onClick={() => setPreviewingExam(null)}>
          <div className={`${previewStyles.modal} ${examAnim.closing ? previewStyles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={previewStyles.header}>
              <div className={previewStyles.headerInfo}>
                <h2 className={previewStyles.title}>{previewingExam.title}</h2>
                {previewingExam.courseId && (
                  <div className={previewStyles.subtitle}>
                    {courses.find(c => c.id === previewingExam.courseId)?.code || courses.find(c => c.id === previewingExam.courseId)?.name}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewingExam(null)} className={previewStyles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <div className={previewStyles.content}>
              {previewingExam.examAt && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Date & Time</div>
                  <div className={previewStyles.sectionValue}>
                    {formatDate(previewingExam.examAt)} {formatTime(previewingExam.examAt)}
                  </div>
                </div>
              )}
              {previewingExam.location && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Location</div>
                  <div className={previewStyles.sectionValue}>{previewingExam.location}</div>
                </div>
              )}
              {previewingExam.notes && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Notes</div>
                  <div className={previewStyles.sectionValuePrewrap}>{previewingExam.notes}</div>
                </div>
              )}
              {previewingExam.tags && previewingExam.tags.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Tags</div>
                  <div className={previewStyles.tags}>
                    {previewingExam.tags.map((tag: string) => (
                      <span key={tag} className={previewStyles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {previewingExam.links && previewingExam.links.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Links</div>
                  <div className={previewStyles.linksList}>
                    {previewingExam.links.map((link: { label: string; url: string }, idx: number) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={previewStyles.linkCard}>
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {previewingExam.files && previewingExam.files.length > 0 && (
                <div className={previewStyles.section}>
                  <div className={previewStyles.sectionLabel}>Files</div>
                  <div className={previewStyles.linksList}>
                    {previewingExam.files.map((file: any, idx: number) => (
                      <button
                        key={`${file.url}-${idx}`}
                        type="button"
                        onClick={() => setPreviewingFile({ file, allFiles: previewingExam.files, index: idx })}
                        className={previewStyles.fileCard}
                      >
                        <FileIcon size={14} className={previewStyles.fileIcon} />
                        <span className={previewStyles.fileName}>{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={previewStyles.footer}>
              <Link href={`/exams?preview=${previewingExam.id}`} style={{ flex: 1 }}>
                <Button variant="primary" size={isMobile ? 'sm' : 'md'} style={{ width: '100%' }} onClick={() => setPreviewingExam(null)}>
                  View in Exams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ); })()}

      {/* Event Detail Modal (with edit support) */}
      <EventDetailModal
        isOpen={!!previewingEvent}
        event={previewingEvent ? {
          id: previewingEvent.id,
          type: 'event' as const,
          title: previewingEvent.title,
          startAt: previewingEvent.startAt,
          endAt: previewingEvent.endAt,
          allDay: previewingEvent.allDay,
          color: previewingEvent.color,
          location: previewingEvent.location,
          description: previewingEvent.description,
        } as InternalCalendarEvent : null}
        onClose={() => setPreviewingEvent(null)}
        courses={courses}
        tasks={tasks}
        deadlines={deadlines}
        workItems={workItems}
        exams={exams}
        calendarEvents={calendarEvents}
        onEventUpdate={(updatedEvent) => {
          useAppStore.getState().updateCalendarEvent(updatedEvent.id, updatedEvent);
          setPreviewingEvent(null);
        }}
      />

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
