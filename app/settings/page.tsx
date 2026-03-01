'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getDefaultCustomColors, getCustomColorSetForTheme, CustomColors, CustomColorSet, getEventTypeColors } from '@/lib/collegeColors';
import { getThemeColors, getVisualTheme } from '@/lib/visualThemes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import ConfirmationModal from '@/components/ConfirmationModal';
import { showDeleteToast } from '@/components/ui/DeleteToast';
import { Monitor, RefreshCw, Link2, Unlink, ChevronDown, AlertCircle, Chrome, ExternalLink, Calendar } from 'lucide-react';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useHighlightElement, useTabFromSearchParams } from '@/hooks/useHighlightElement';
import { TOOLS_CARDS, CARD_LABELS, PAGES, DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { PetSprite } from '@/components/pet/PetSprite';
import { sprites, animalLabels, animalPreviewSize } from '@/components/pet/petSprites';
import type { AnimalType } from '@/components/pet/petSprites';

interface CanvasStatus {
  connected: boolean;
  syncEnabled: boolean;
  instanceUrl: string | null;
  userId: string | null;
  userName: string | null;
  lastSyncedAt: string | null;
  syncCourses: boolean;
  syncAssignments: boolean;
  syncGrades: boolean;
  syncEvents: boolean;
  syncAnnouncements: boolean;
  autoMarkComplete: boolean;
}

interface BlackboardStatus {
  connected: boolean;
  syncEnabled: boolean;
  instanceUrl: string | null;
  userId: string | null;
  userName: string | null;
  lastSyncedAt: string | null;
  tokenExpiresAt: string | null;
  syncCourses: boolean;
  syncAssignments: boolean;
  syncGrades: boolean;
  syncEvents: boolean;
  autoMarkComplete: boolean;
}

interface MoodleStatus {
  connected: boolean;
  syncEnabled: boolean;
  instanceUrl: string | null;
  userId: string | null;
  userName: string | null;
  lastSyncedAt: string | null;
  syncCourses: boolean;
  syncAssignments: boolean;
  syncGrades: boolean;
  syncEvents: boolean;
  syncAnnouncements: boolean;
  autoMarkComplete: boolean;
}

interface BrightspaceStatus {
  connected: boolean;
  syncEnabled: boolean;
  instanceUrl: string | null;
  userId: string | null;
  userName: string | null;
  lastSyncedAt: string | null;
  tokenExpiresAt: string | null;
  syncCourses: boolean;
  syncAssignments: boolean;
  syncGrades: boolean;
  syncEvents: boolean;
  syncAnnouncements: boolean;
  autoMarkComplete: boolean;
}

interface GoogleCalendarStatus {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  syncImportEvents: boolean;
  syncExportEvents: boolean;
  syncExportDeadlines: boolean;
  syncExportExams: boolean;
  importCalendarId: string | null;
  exportCalendarId: string | null;
}

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { data: session, status: sessionStatus } = useSession();
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeRequestMessage, setCollegeRequestMessage] = useState('');
  const [collegeRequestLoading, setCollegeRequestLoading] = useState(false);
  const [collegesList, setCollegesList] = useState<Array<{ fullName: string; acronym: string }>>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueReportMessage, setIssueReportMessage] = useState('');
  const [issueReportLoading, setIssueReportLoading] = useState(false);
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureRequestMessage, setFeatureRequestMessage] = useState('');
  const [featureRequestLoading, setFeatureRequestLoading] = useState(false);
  const [betaFeedbackText, setBetaFeedbackText] = useState('');
  const [betaFeedbackMessage, setBetaFeedbackMessage] = useState('');
  const [betaFeedbackLoading, setBetaFeedbackLoading] = useState(false);
  const [notificationPrefsExpanded, setNotificationPrefsExpanded] = useState(false);
  const [betaWarningOpen, setBetaWarningOpen] = useState(false);
  const betaWarningRef = useRef<HTMLDivElement>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('v1.6.1');
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);


  // Visibility customization state
  const [activeCustomizationTab, setActiveCustomizationTab] = useState<'pages' | 'tools'>('pages');
  const [visiblePages, setVisiblePages] = useState<string[]>(DEFAULT_VISIBLE_PAGES);
  const [visibleToolsCards, setVisibleToolsCards] = useState<string[]>(DEFAULT_VISIBLE_TOOLS_CARDS);
  const [visiblePagesOrder, setVisiblePagesOrder] = useState<string[]>(Object.values(PAGES).filter(p => p !== 'Settings'));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [visibilityMessage, setVisibilityMessage] = useState('');
  const [isMacDesktop, setIsMacDesktop] = useState(false);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationModeLoading, setVacationModeLoading] = useState(false);
  const [emailAnnouncements, setEmailAnnouncements] = useState(false);
  const [emailAccountAlerts, setEmailAccountAlerts] = useState(false);
  const [emailExamReminders, setEmailExamReminders] = useState(false);
  const [emailDeadlineReminders, setEmailDeadlineReminders] = useState(false);
  const [emailTaskReminders, setEmailTaskReminders] = useState(false);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [emailReadingReminders, setEmailReadingReminders] = useState(false);
  const [emailProjectReminders, setEmailProjectReminders] = useState(false);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(false);
  const [notifyAccountAlerts, setNotifyAccountAlerts] = useState(false);
  const [notifyExamReminders, setNotifyExamReminders] = useState(false);
  const [notifyDeadlineReminders, setNotifyDeadlineReminders] = useState(false);
  const [notifyTaskReminders, setNotifyTaskReminders] = useState(false);
  const [notifyReadingReminders, setNotifyReadingReminders] = useState(false);
  const [notifyProjectReminders, setNotifyProjectReminders] = useState(false);
  const [reminderTimingOpen, setReminderTimingOpen] = useState(false);
  const [examReminders, setExamReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([
    { enabled: false, value: 7, unit: 'days' },
    { enabled: false, value: 1, unit: 'days' },
    { enabled: false, value: 3, unit: 'hours' }
  ]);
  const [deadlineReminders, setDeadlineReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([
    { enabled: false, value: 1, unit: 'days' },
    { enabled: false, value: 3, unit: 'hours' }
  ]);
  const [readingReminders, setReadingReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([
    { enabled: false, value: 1, unit: 'days' },
    { enabled: false, value: 3, unit: 'hours' }
  ]);
  const [projectReminders, setProjectReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([
    { enabled: false, value: 1, unit: 'days' },
    { enabled: false, value: 3, unit: 'hours' }
  ]);
  const [taskReminders, setTaskReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([
    { enabled: false, value: 1, unit: 'days' },
    { enabled: false, value: 3, unit: 'hours' }
  ]);

  // Settings tab state - initialize from localStorage
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'preferences' | 'integrations' | 'about'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settingsTab');
      if (saved && ['appearance', 'preferences', 'integrations', 'about'].includes(saved)) {
        return saved as 'appearance' | 'preferences' | 'integrations' | 'about';
      }
    }
    return 'appearance';
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('settingsTab', activeSettingsTab);
  }, [activeSettingsTab]);

  // Handle tab switching from URL params (for global search navigation)
  useTabFromSearchParams(
    ['appearance', 'preferences', 'integrations', 'about'],
    'appearance',
    (tab) => setActiveSettingsTab(tab as typeof activeSettingsTab)
  );

  // Handle element highlighting from global search
  useHighlightElement();

  // Canvas LMS Integration state
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus | null>(null);
  const [canvasInstanceUrl, setCanvasInstanceUrl] = useState('');
  const [canvasAccessToken, setCanvasAccessToken] = useState('');
  const [canvasConnecting, setCanvasConnecting] = useState(false);
  const [canvasSyncing, setCanvasSyncing] = useState(false);
  const [canvasMessage, setCanvasMessage] = useState('');
  const [canvasSyncCourses, setCanvasSyncCourses] = useState(true);
  const [canvasSyncAssignments, setCanvasSyncAssignments] = useState(true);
  const [canvasSyncGrades, setCanvasSyncGrades] = useState(true);
  const [canvasSyncEvents, setCanvasSyncEvents] = useState(true);
  const [canvasSyncAnnouncements, setCanvasSyncAnnouncements] = useState(true);
  const [canvasAutoMarkComplete, setCanvasAutoMarkComplete] = useState(true);
  const [showCanvasDisconnectModal, setShowCanvasDisconnectModal] = useState(false);
  const [canvasSyncSettingsOpen, setCanvasSyncSettingsOpen] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const pendingDisconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Blackboard LMS Integration state
  const [blackboardStatus, setBlackboardStatus] = useState<BlackboardStatus | null>(null);
  const [blackboardInstanceUrl, setBlackboardInstanceUrl] = useState('');
  const [blackboardAppKey, setBlackboardAppKey] = useState('');
  const [blackboardAppSecret, setBlackboardAppSecret] = useState('');
  const [blackboardConnecting, setBlackboardConnecting] = useState(false);
  const [blackboardSyncing, setBlackboardSyncing] = useState(false);
  const [blackboardMessage, setBlackboardMessage] = useState('');
  const [blackboardSyncCourses, setBlackboardSyncCourses] = useState(true);
  const [blackboardSyncAssignments, setBlackboardSyncAssignments] = useState(true);
  const [blackboardSyncGrades, setBlackboardSyncGrades] = useState(true);
  const [blackboardSyncEvents, setBlackboardSyncEvents] = useState(true);
  const [blackboardAutoMarkComplete, setBlackboardAutoMarkComplete] = useState(true);
  const [showBlackboardDisconnectModal, setShowBlackboardDisconnectModal] = useState(false);
  const [blackboardSyncSettingsOpen, setBlackboardSyncSettingsOpen] = useState(false);
  const [pendingBlackboardDisconnect, setPendingBlackboardDisconnect] = useState(false);
  const pendingBlackboardDisconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Moodle LMS Integration state
  const [moodleStatus, setMoodleStatus] = useState<MoodleStatus | null>(null);
  const [moodleInstanceUrl, setMoodleInstanceUrl] = useState('');
  const [moodleToken, setMoodleToken] = useState('');
  const [moodleConnecting, setMoodleConnecting] = useState(false);
  const [moodleSyncing, setMoodleSyncing] = useState(false);
  const [moodleMessage, setMoodleMessage] = useState('');
  const [moodleSyncCourses, setMoodleSyncCourses] = useState(true);
  const [moodleSyncAssignments, setMoodleSyncAssignments] = useState(true);
  const [moodleSyncGrades, setMoodleSyncGrades] = useState(true);
  const [moodleSyncEvents, setMoodleSyncEvents] = useState(true);
  const [moodleSyncAnnouncements, setMoodleSyncAnnouncements] = useState(true);
  const [moodleAutoMarkComplete, setMoodleAutoMarkComplete] = useState(true);
  const [showMoodleDisconnectModal, setShowMoodleDisconnectModal] = useState(false);
  const [moodleSyncSettingsOpen, setMoodleSyncSettingsOpen] = useState(false);
  const [pendingMoodleDisconnect, setPendingMoodleDisconnect] = useState(false);
  const pendingMoodleDisconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Brightspace LMS Integration state
  const [brightspaceStatus, setBrightspaceStatus] = useState<BrightspaceStatus | null>(null);
  const [brightspaceInstanceUrl, setBrightspaceInstanceUrl] = useState('');
  const [brightspaceClientId, setBrightspaceClientId] = useState('');
  const [brightspaceClientSecret, setBrightspaceClientSecret] = useState('');
  const [brightspaceConnecting, setBrightspaceConnecting] = useState(false);
  const [brightspaceSyncing, setBrightspaceSyncing] = useState(false);
  const [brightspaceMessage, setBrightspaceMessage] = useState('');
  const [brightspaceSyncCourses, setBrightspaceSyncCourses] = useState(true);
  const [brightspaceSyncAssignments, setBrightspaceSyncAssignments] = useState(true);
  const [brightspaceSyncGrades, setBrightspaceSyncGrades] = useState(true);
  const [brightspaceSyncEvents, setBrightspaceSyncEvents] = useState(true);
  const [brightspaceSyncAnnouncements, setBrightspaceSyncAnnouncements] = useState(true);
  const [brightspaceAutoMarkComplete, setBrightspaceAutoMarkComplete] = useState(true);
  const [showBrightspaceDisconnectModal, setShowBrightspaceDisconnectModal] = useState(false);
  const [brightspaceSyncSettingsOpen, setBrightspaceSyncSettingsOpen] = useState(false);
  const [pendingBrightspaceDisconnect, setPendingBrightspaceDisconnect] = useState(false);
  const pendingBrightspaceDisconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Google Calendar Integration state
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState<GoogleCalendarStatus | null>(null);
  const [googleCalendarConnecting, setGoogleCalendarConnecting] = useState(false);
  const [googleCalendarSyncing, setGoogleCalendarSyncing] = useState(false);
  const [googleCalendarMessage, setGoogleCalendarMessage] = useState('');
  const [googleCalendarSyncSettingsOpen, setGoogleCalendarSyncSettingsOpen] = useState(false);
  const [showGoogleCalendarDisconnectModal, setShowGoogleCalendarDisconnectModal] = useState(false);
  const [pendingGoogleCalendarDisconnect, setPendingGoogleCalendarDisconnect] = useState(false);
  const pendingGoogleCalendarDisconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Local state for sliders (smooth UI while debouncing API calls)
  const [localGradientIntensity, setLocalGradientIntensity] = useState(50);
  const [localGlowIntensity, setLocalGlowIntensity] = useState(50);
  const gradientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings, updateSettings, updateSettingsLocal, loadFromDatabase } = useAppStore();
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

  // Custom theme and visual effects only apply for premium users
  const effectiveUseCustomTheme = isPremium && settings.useCustomTheme;
  const effectiveCustomColors = isPremium ? settings.customColors : null;
  const effectiveVisualTheme = isPremium ? settings.visualTheme : null;
  // Visual theme takes priority
  const accentColor = (() => {
    if (effectiveVisualTheme && effectiveVisualTheme !== 'default') {
      const themeColors = getThemeColors(effectiveVisualTheme, settings.theme || 'dark');
      if (themeColors.accent) return themeColors.accent;
    }
    if (effectiveUseCustomTheme && effectiveCustomColors) {
      return getCustomColorSetForTheme(effectiveCustomColors as CustomColors, settings.theme || 'dark').accent;
    }
    return colorPalette.accent;
  })();
  const glowIntensity = isPremium ? (settings.glowIntensity ?? 50) : 50;
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');
  const confirmBeforeDelete = settings.confirmBeforeDelete ?? true;

  // Check if running on Mac desktop browser
  useEffect(() => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setIsMacDesktop(isMac);
  }, []);

  // Close beta warning tooltip when clicking outside
  useEffect(() => {
    if (!betaWarningOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (betaWarningRef.current && !betaWarningRef.current.contains(e.target as Node)) {
        setBetaWarningOpen(false);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [betaWarningOpen]);

  // Fetch colleges list from API (database is source of truth)
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        if (response.ok) {
          const data = await response.json();
          // Use database colleges directly (already filtered by isActive)
          setCollegesList(data.colleges || []);
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    };
    fetchColleges();
  }, []);

  // Fetch Canvas connection status
  useEffect(() => {
    const fetchCanvasStatus = async () => {
      try {
        const response = await fetch('/api/canvas/status');
        if (response.ok) {
          const data = await response.json();
          setCanvasStatus(data);
          setCanvasSyncCourses(data.syncCourses ?? true);
          setCanvasSyncAssignments(data.syncAssignments ?? true);
          setCanvasSyncGrades(data.syncGrades ?? true);
          setCanvasSyncEvents(data.syncEvents ?? true);
          setCanvasSyncAnnouncements(data.syncAnnouncements ?? true);
          setCanvasAutoMarkComplete(data.autoMarkComplete ?? true);
        }
      } catch (error) {
        console.error('Error fetching Canvas status:', error);
      }
    };
    if (session?.user) {
      fetchCanvasStatus();
    }
  }, [session]);

  // Fetch Blackboard connection status
  useEffect(() => {
    const fetchBlackboardStatus = async () => {
      try {
        const response = await fetch('/api/blackboard/status');
        if (response.ok) {
          const data = await response.json();
          setBlackboardStatus(data);
          setBlackboardSyncCourses(data.syncCourses ?? true);
          setBlackboardSyncAssignments(data.syncAssignments ?? true);
          setBlackboardSyncGrades(data.syncGrades ?? true);
          setBlackboardSyncEvents(data.syncEvents ?? true);
          setBlackboardAutoMarkComplete(data.autoMarkComplete ?? true);
        }
      } catch (error) {
        console.error('Error fetching Blackboard status:', error);
      }
    };
    if (session?.user) {
      fetchBlackboardStatus();
    }
  }, [session]);

  // Fetch Moodle connection status
  useEffect(() => {
    const fetchMoodleStatus = async () => {
      try {
        const response = await fetch('/api/moodle/status');
        if (response.ok) {
          const data = await response.json();
          setMoodleStatus(data);
          setMoodleSyncCourses(data.syncCourses ?? true);
          setMoodleSyncAssignments(data.syncAssignments ?? true);
          setMoodleSyncGrades(data.syncGrades ?? true);
          setMoodleSyncEvents(data.syncEvents ?? true);
          setMoodleSyncAnnouncements(data.syncAnnouncements ?? true);
          setMoodleAutoMarkComplete(data.autoMarkComplete ?? true);
        }
      } catch (error) {
        console.error('Error fetching Moodle status:', error);
      }
    };
    if (session?.user) {
      fetchMoodleStatus();
    }
  }, [session]);

  // Fetch Brightspace connection status
  useEffect(() => {
    const fetchBrightspaceStatus = async () => {
      try {
        const response = await fetch('/api/brightspace/status');
        if (response.ok) {
          const data = await response.json();
          setBrightspaceStatus(data);
          setBrightspaceSyncCourses(data.syncCourses ?? true);
          setBrightspaceSyncAssignments(data.syncAssignments ?? true);
          setBrightspaceSyncGrades(data.syncGrades ?? true);
          setBrightspaceSyncEvents(data.syncEvents ?? true);
          setBrightspaceSyncAnnouncements(data.syncAnnouncements ?? true);
          setBrightspaceAutoMarkComplete(data.autoMarkComplete ?? true);
        }
      } catch (error) {
        console.error('Error fetching Brightspace status:', error);
      }
    };
    if (session?.user) {
      fetchBrightspaceStatus();
    }
  }, [session]);

  // Fetch Google Calendar connection status
  useEffect(() => {
    const fetchGoogleCalendarStatus = async () => {
      try {
        const response = await fetch('/api/google-calendar/status');
        if (response.ok) {
          const data = await response.json();
          setGoogleCalendarStatus(data);
        }
      } catch (error) {
        console.error('Error fetching Google Calendar status:', error);
      }
    };
    if (session?.user) {
      fetchGoogleCalendarStatus();
    }
  }, [session]);

  // Fetch gamification/vacation mode status
  useEffect(() => {
    const fetchGamificationStatus = async () => {
      try {
        const timezoneOffset = new Date().getTimezoneOffset();
        const response = await fetch(`/api/gamification?tz=${timezoneOffset}`);
        if (response.ok) {
          const data = await response.json();
          setVacationMode(data.streak?.vacationMode ?? false);
        }
      } catch (error) {
        console.error('Error fetching gamification status:', error);
      }
    };
    if (session?.user) {
      fetchGamificationStatus();
    }
  }, [session]);

  useEffect(() => {
    // Only run once on mount to initialize local state from store
    if (mounted) return;

    // Store is already initialized globally by AppLoader
    setUniversity(settings.university || null);
    setSelectedTheme(settings.theme || 'dark');
    // Use saved visible pages directly - don't merge with defaults
    // as that would add back pages the user explicitly hid
    // Migrate legacy page names to unified "Work" page
    const migratePageName = (p: string) => {
      if (p === 'Deadlines' || p === 'Assignments' || p === 'Tasks') return 'Work';
      return p;
    };
    const savedVisiblePages = [...new Set((settings.visiblePages || []).map(migratePageName))];
    setVisiblePages(savedVisiblePages.length > 0 ? savedVisiblePages : DEFAULT_VISIBLE_PAGES);
    setVisibleToolsCards(settings.visibleToolsCards || DEFAULT_VISIBLE_TOOLS_CARDS);

    // Load pages order from settings
    if (settings.visiblePagesOrder) {
      const order = (typeof settings.visiblePagesOrder === 'string'
        ? JSON.parse(settings.visiblePagesOrder)
        : settings.visiblePagesOrder) as string[];
      // Migrate legacy page names to unified "Work" page and remove duplicates
      const migratedOrder = [...new Set(order.map(migratePageName))];
      // Add any new pages that aren't in the saved order (excluding Settings)
      const allPages = Object.values(PAGES).filter(p => p !== 'Settings');
      const newPages = allPages.filter(p => !migratedOrder.includes(p));
      setVisiblePagesOrder([...migratedOrder, ...newPages]);
    } else {
      setVisiblePagesOrder(Object.values(PAGES).filter(p => p !== 'Settings'));
    }

    // Load custom theme settings
    setUseCustomTheme(settings.useCustomTheme || false);
    if (settings.customColors) {
      setCustomColors(settings.customColors as CustomColors);
    } else {
      // Initialize with defaults based on university (includes both light and dark)
      setCustomColors(getDefaultCustomColors(settings.university));
    }

    // Load email preferences
    setEmailAnnouncements(settings.emailAnnouncements === true);
    setEmailAccountAlerts(settings.emailAccountAlerts === true);
    setEmailExamReminders(settings.emailExamReminders === true);
    setEmailDeadlineReminders(settings.emailDeadlineReminders === true);
    setEmailTaskReminders(settings.emailTaskReminders === true);
    setEmailReadingReminders(settings.emailReadingReminders === true);
    setEmailProjectReminders(settings.emailProjectReminders === true);
    setEmailWeeklyDigest(settings.emailWeeklyDigest === true);

    // Load in-app notification preferences
    setNotifyAnnouncements(settings.notifyAnnouncements === true);
    setNotifyAccountAlerts(settings.notifyAccountAlerts === true);
    setNotifyExamReminders(settings.notifyExamReminders === true);
    setNotifyDeadlineReminders(settings.notifyDeadlineReminders === true);
    setNotifyTaskReminders(settings.notifyTaskReminders === true);
    setNotifyReadingReminders(settings.notifyReadingReminders === true);
    setNotifyProjectReminders(settings.notifyProjectReminders === true);

    // Load reminder timing preferences
    if (settings.examReminders) {
      setExamReminders(settings.examReminders);
    }
    if (settings.deadlineReminders) {
      setDeadlineReminders(settings.deadlineReminders);
    }
    if (settings.taskReminders) {
      setTaskReminders(settings.taskReminders);
    }
    if (settings.readingReminders) {
      setReadingReminders(settings.readingReminders);
    }
    if (settings.projectReminders) {
      setProjectReminders(settings.projectReminders);
    }

    // Load visual effects sliders
    setLocalGradientIntensity(settings.gradientIntensity ?? 50);
    setLocalGlowIntensity(settings.glowIntensity ?? 50);

    setMounted(true);
  }, [settings, mounted]);

  // Fetch current version from API
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/releases');
        if (response.ok) {
          const data = await response.json();
          if (data.releases && data.releases.length > 0) {
            setCurrentVersion(data.releases[0].version);
          }
        }
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };
    fetchVersion();
  }, []);

  if (!mounted) {
    return <PageSkeleton cards={4} headerWidth="20%" />;
  }

  // Slider handlers: update store immediately for real-time visual effects,
  // debounce only the API call to avoid excessive network requests
  const handleGradientChange = (value: number) => {
    setLocalGradientIntensity(value);
    // Update store immediately for instant visual feedback across all components
    updateSettingsLocal({ gradientIntensity: value });
    // Debounce only the API persistence
    if (gradientDebounceRef.current) {
      clearTimeout(gradientDebounceRef.current);
    }
    gradientDebounceRef.current = setTimeout(() => {
      updateSettings({ gradientIntensity: value });
    }, 300);
  };

  const handleGlowChange = (value: number) => {
    setLocalGlowIntensity(value);
    // Update store immediately for instant visual feedback across all components
    updateSettingsLocal({ glowIntensity: value });
    // Debounce only the API persistence
    if (glowDebounceRef.current) {
      clearTimeout(glowDebounceRef.current);
    }
    glowDebounceRef.current = setTimeout(() => {
      updateSettings({ glowIntensity: value });
    }, 300);
  };

  // Toggle vacation mode for streaks
  const handleToggleVacationMode = async () => {
    if (!session?.user) return;
    setVacationModeLoading(true);
    try {
      const response = await fetch('/api/gamification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacationMode: !vacationMode }),
      });
      if (response.ok) {
        const data = await response.json();
        setVacationMode(data.vacationMode);
      }
    } catch (error) {
      console.error('Error toggling vacation mode:', error);
    } finally {
      setVacationModeLoading(false);
    }
  };

  const handleSubmitCollegeRequest = async () => {
    if (!collegeRequestName.trim()) {
      setCollegeRequestMessage('Please enter a college name');
      setTimeout(() => setCollegeRequestMessage(''), 3000);
      return;
    }

    setCollegeRequestLoading(true);
    setCollegeRequestMessage('');

    try {
      const response = await fetch('/api/college-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeName: collegeRequestName }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorText = data.error || 'We couldn\'t save your college request. Please try again.';
        setCollegeRequestMessage(`✗ ${errorText}`);
        setCollegeRequestLoading(false);
        setTimeout(() => setCollegeRequestMessage(''), 5000);
        console.error('College request error:', data);
        return;
      }

      setCollegeRequestMessage('✓ ' + data.message);
      setCollegeRequestName('');
      setCollegeRequestLoading(false);

      // Trigger notification refresh in the bell component
      window.dispatchEvent(new Event('notification-refresh'));

      setTimeout(() => setCollegeRequestMessage(''), 3000);
    } catch (error) {
      setCollegeRequestMessage('✗ We couldn\'t save your college request. Please try again.');
      setCollegeRequestLoading(false);
      setTimeout(() => setCollegeRequestMessage(''), 3000);
    }
  };

  const handleSubmitIssueReport = async () => {
    if (!issueDescription.trim()) {
      setIssueReportMessage('Please enter a description');
      setTimeout(() => setIssueReportMessage(''), 3000);
      return;
    }

    setIssueReportLoading(true);
    setIssueReportMessage('');

    try {
      const response = await fetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issueDescription }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text());
        setIssueReportMessage('✗ We encountered a problem saving your report. Please try again.');
        setIssueReportLoading(false);
        setTimeout(() => setIssueReportMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.error || 'We couldn\'t save your report. Please try again.';
        setIssueReportMessage(`✗ ${errorText}`);
        setIssueReportLoading(false);
        setTimeout(() => setIssueReportMessage(''), 5000);
        console.error('Issue report error:', data);
        return;
      }

      setIssueReportMessage('✓ Issue report submitted successfully');
      setIssueDescription('');
      setIssueReportLoading(false);

      // Trigger notification refresh in the bell component
      window.dispatchEvent(new Event('notification-refresh'));

      setTimeout(() => setIssueReportMessage(''), 3000);
    } catch (error) {
      console.error('Issue report submission error:', error);
      setIssueReportMessage('✗ We couldn\'t save your report. Please try again.');
      setIssueReportLoading(false);
      setTimeout(() => setIssueReportMessage(''), 3000);
    }
  };

  const handleSubmitFeatureRequest = async () => {
    if (!featureDescription.trim()) {
      setFeatureRequestMessage('Please enter a description');
      setTimeout(() => setFeatureRequestMessage(''), 3000);
      return;
    }

    setFeatureRequestLoading(true);
    setFeatureRequestMessage('');

    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: featureDescription }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text());
        setFeatureRequestMessage('✗ We encountered a problem saving your request. Please try again.');
        setFeatureRequestLoading(false);
        setTimeout(() => setFeatureRequestMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.error || 'We couldn\'t save your request. Please try again.';
        setFeatureRequestMessage(`✗ ${errorText}`);
        setFeatureRequestLoading(false);
        setTimeout(() => setFeatureRequestMessage(''), 5000);
        console.error('Feature request error:', data);
        return;
      }

      setFeatureRequestMessage('✓ Feature request submitted successfully');
      setFeatureDescription('');
      setFeatureRequestLoading(false);

      // Trigger notification refresh in the bell component
      window.dispatchEvent(new Event('notification-refresh'));

      setTimeout(() => setFeatureRequestMessage(''), 3000);
    } catch (error) {
      console.error('Feature request submission error:', error);
      setFeatureRequestMessage('✗ We couldn\'t save your request. Please try again.');
      setFeatureRequestLoading(false);
      setTimeout(() => setFeatureRequestMessage(''), 3000);
    }
  };

  // Canvas Integration Handlers
  const handleCanvasConnect = async () => {
    if (!canvasInstanceUrl.trim() || !canvasAccessToken.trim()) {
      setCanvasMessage('Please enter both Canvas instance URL and access token');
      setTimeout(() => setCanvasMessage(''), 3000);
      return;
    }

    setCanvasConnecting(true);
    setCanvasMessage('');

    try {
      const response = await fetch('/api/canvas/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: canvasInstanceUrl,
          accessToken: canvasAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCanvasMessage(`✗ ${data.error || 'Failed to connect to Canvas'}`);
        setCanvasConnecting(false);
        setTimeout(() => setCanvasMessage(''), 5000);
        return;
      }

      setCanvasMessage(`✓ ${data.message}`);
      setCanvasInstanceUrl('');
      setCanvasAccessToken('');

      // Refresh Canvas status
      const statusResponse = await fetch('/api/canvas/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setCanvasStatus(statusData);

        // Automatically sync after successful connection
        setCanvasMessage('✓ Connected! Starting initial sync...');
        try {
          const syncResponse = await fetch('/api/canvas/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncCourses: statusData.syncCourses ?? true,
              syncAssignments: statusData.syncAssignments ?? true,
              syncGrades: statusData.syncGrades ?? true,
              syncEvents: statusData.syncEvents ?? true,
              syncAnnouncements: statusData.syncAnnouncements ?? true,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            setCanvasMessage(`✓ Initial sync complete! ${syncResult.results?.courses?.created || 0} courses, ${syncResult.results?.assignments?.created || 0} assignments synced.`);

            // Refresh Canvas status again to show last synced time
            const refreshResponse = await fetch('/api/canvas/status');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setCanvasStatus(refreshData);
            }

            // Reload the store data to show synced items
            const { loadFromDatabase } = useAppStore.getState();
            await loadFromDatabase();
          } else {
            setCanvasMessage('✓ Connected! Initial sync may have had issues - you can try syncing manually.');
          }
        } catch (syncError) {
          console.error('Initial sync error:', syncError);
          setCanvasMessage('✓ Connected! You can sync your data using the Sync Now button.');
        }
      }

      setCanvasConnecting(false);
      setTimeout(() => setCanvasMessage(''), 5000);
    } catch (error) {
      console.error('Canvas connection error:', error);
      setCanvasMessage('✗ Failed to connect to Canvas. Please try again.');
      setCanvasConnecting(false);
      setTimeout(() => setCanvasMessage(''), 3000);
    }
  };

  const performCanvasDisconnect = async () => {
    try {
      const response = await fetch('/api/canvas/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setCanvasStatus(null);
        setCanvasMessage('✓ Successfully disconnected from Canvas');
        setTimeout(() => setCanvasMessage(''), 3000);
      } else {
        const data = await response.json();
        setCanvasMessage(`✗ ${data.error || 'Failed to disconnect'}`);
        setTimeout(() => setCanvasMessage(''), 3000);
      }
    } catch (error) {
      console.error('Canvas disconnect error:', error);
      setCanvasMessage('✗ Failed to disconnect. Please try again.');
      setTimeout(() => setCanvasMessage(''), 3000);
    }
  };

  const handleCanvasDisconnect = async () => {
    setShowCanvasDisconnectModal(false);
    await performCanvasDisconnect();
  };

  const handleCanvasDisconnectClick = () => {
    if (confirmBeforeDelete) {
      setShowCanvasDisconnectModal(true);
    } else {
      // Show toast with undo
      setPendingDisconnect(true);

      // Clear any existing timeout
      if (pendingDisconnectTimeout.current) {
        clearTimeout(pendingDisconnectTimeout.current);
      }

      showDeleteToast('Canvas disconnected', () => {
        // Undo - cancel the disconnect
        if (pendingDisconnectTimeout.current) {
          clearTimeout(pendingDisconnectTimeout.current);
          pendingDisconnectTimeout.current = null;
        }
        setPendingDisconnect(false);
      });

      // Schedule actual disconnect after toast duration
      pendingDisconnectTimeout.current = setTimeout(async () => {
        await performCanvasDisconnect();
        setPendingDisconnect(false);
        pendingDisconnectTimeout.current = null;
      }, 5000);
    }
  };

  const handleCanvasSync = async () => {
    setCanvasSyncing(true);
    setCanvasMessage('');

    try {
      const response = await fetch('/api/canvas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCourses: canvasSyncCourses,
          syncAssignments: canvasSyncAssignments,
          syncGrades: canvasSyncGrades,
          syncEvents: canvasSyncEvents,
          syncAnnouncements: canvasSyncAnnouncements,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCanvasMessage(`✗ ${data.error || 'Sync failed'}`);
        setCanvasSyncing(false);
        setTimeout(() => setCanvasMessage(''), 5000);
        return;
      }

      // Build success message
      const result = data.result;
      const parts = [];
      if (canvasSyncCourses && (result.courses.created > 0 || result.courses.updated > 0)) {
        parts.push(`${result.courses.created + result.courses.updated} courses`);
      }
      if (canvasSyncAssignments && (result.assignments.created > 0 || result.assignments.updated > 0)) {
        parts.push(`${result.assignments.created + result.assignments.updated} assignments`);
      }
      if (canvasSyncGrades && result.grades.updated > 0) {
        parts.push(`${result.grades.updated} grades`);
      }
      if (canvasSyncEvents && (result.events.created > 0 || result.events.updated > 0)) {
        parts.push(`${result.events.created + result.events.updated} events`);
      }
      if (canvasSyncAnnouncements && result.announcements.created > 0) {
        parts.push(`${result.announcements.created} announcements`);
      }

      const syncedMessage = parts.length > 0 ? `Synced ${parts.join(', ')}` : 'No new data to sync';
      setCanvasMessage(`✓ ${syncedMessage}`);

      // Refresh Canvas status to get new lastSyncedAt
      const statusResponse = await fetch('/api/canvas/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setCanvasStatus(statusData);
      }

      // Refresh store data so users see synced courses/deadlines/events immediately
      await loadFromDatabase();

      setCanvasSyncing(false);
      setTimeout(() => setCanvasMessage(''), 5000);
    } catch (error) {
      console.error('Canvas sync error:', error);
      setCanvasMessage('✗ Sync failed. Please try again.');
      setCanvasSyncing(false);
      setTimeout(() => setCanvasMessage(''), 3000);
    }
  };

  const handleCanvasSyncSettingsChange = async (setting: string, value: boolean) => {
    // Update local state immediately
    switch (setting) {
      case 'courses': setCanvasSyncCourses(value); break;
      case 'assignments': setCanvasSyncAssignments(value); break;
      case 'grades': setCanvasSyncGrades(value); break;
      case 'events': setCanvasSyncEvents(value); break;
      case 'announcements': setCanvasSyncAnnouncements(value); break;
      case 'autoMarkComplete': setCanvasAutoMarkComplete(value); break;
    }

    // Save to server
    try {
      // For autoMarkComplete, use camelCase directly; for others, prefix with 'sync'
      const key = setting === 'autoMarkComplete'
        ? 'autoMarkComplete'
        : `sync${setting.charAt(0).toUpperCase() + setting.slice(1)}`;

      await fetch('/api/canvas/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to save sync settings:', error);
    }
  };

  // Google Calendar Integration Handlers
  const handleGoogleCalendarConnect = async () => {
    setGoogleCalendarConnecting(true);
    setGoogleCalendarMessage('');

    try {
      const response = await fetch('/api/google-calendar/connect');
      const data = await response.json();

      if (!response.ok) {
        setGoogleCalendarMessage(`✗ ${data.error || 'Failed to connect'}`);
        setGoogleCalendarConnecting(false);
        setTimeout(() => setGoogleCalendarMessage(''), 5000);
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      setGoogleCalendarMessage('✗ Failed to connect to Google Calendar. Please try again.');
      setGoogleCalendarConnecting(false);
      setTimeout(() => setGoogleCalendarMessage(''), 3000);
    }
  };

  const performGoogleCalendarDisconnect = async () => {
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGoogleCalendarStatus(null);
        setGoogleCalendarMessage('✓ Successfully disconnected from Google Calendar');
        setTimeout(() => setGoogleCalendarMessage(''), 3000);
      } else {
        const data = await response.json();
        setGoogleCalendarMessage(`✗ ${data.error || 'Failed to disconnect'}`);
        setTimeout(() => setGoogleCalendarMessage(''), 3000);
      }
    } catch (error) {
      console.error('Google Calendar disconnect error:', error);
      setGoogleCalendarMessage('✗ Failed to disconnect. Please try again.');
      setTimeout(() => setGoogleCalendarMessage(''), 3000);
    }
  };

  const handleGoogleCalendarDisconnect = async () => {
    setShowGoogleCalendarDisconnectModal(false);
    await performGoogleCalendarDisconnect();
  };

  const handleGoogleCalendarDisconnectClick = () => {
    if (confirmBeforeDelete) {
      setShowGoogleCalendarDisconnectModal(true);
    } else {
      setPendingGoogleCalendarDisconnect(true);

      if (pendingGoogleCalendarDisconnectTimeout.current) {
        clearTimeout(pendingGoogleCalendarDisconnectTimeout.current);
      }

      showDeleteToast('Google Calendar disconnected', () => {
        if (pendingGoogleCalendarDisconnectTimeout.current) {
          clearTimeout(pendingGoogleCalendarDisconnectTimeout.current);
          pendingGoogleCalendarDisconnectTimeout.current = null;
        }
        setPendingGoogleCalendarDisconnect(false);
      });

      pendingGoogleCalendarDisconnectTimeout.current = setTimeout(async () => {
        await performGoogleCalendarDisconnect();
        setPendingGoogleCalendarDisconnect(false);
        pendingGoogleCalendarDisconnectTimeout.current = null;
      }, 5000);
    }
  };

  const handleGoogleCalendarSync = async () => {
    setGoogleCalendarSyncing(true);
    setGoogleCalendarMessage('');

    try {
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('[GoogleCalendarSync] Sync response:', JSON.stringify(data.debug, null, 2), data.result);

      if (!response.ok) {
        setGoogleCalendarMessage(`✗ ${data.error || 'Sync failed'}`);
        setGoogleCalendarSyncing(false);
        setTimeout(() => setGoogleCalendarMessage(''), 5000);
        return;
      }

      // Build success message
      const r = data.result;
      const parts = [];
      if (r.imported.created > 0 || r.imported.updated > 0) {
        parts.push(`${r.imported.created + r.imported.updated} imported`);
      }
      if (r.exportedEvents.created > 0 || r.exportedEvents.updated > 0) {
        parts.push(`${r.exportedEvents.created + r.exportedEvents.updated} events exported`);
      }
      if (r.exportedDeadlines.created > 0 || r.exportedDeadlines.updated > 0) {
        parts.push(`${r.exportedDeadlines.created + r.exportedDeadlines.updated} deadlines exported`);
      }
      if (r.exportedExams.created > 0 || r.exportedExams.updated > 0) {
        parts.push(`${r.exportedExams.created + r.exportedExams.updated} exams exported`);
      }
      if (r.exportedWork?.created > 0 || r.exportedWork?.updated > 0) {
        parts.push(`${(r.exportedWork?.created || 0) + (r.exportedWork?.updated || 0)} work items exported`);
      }
      if (r.exportedClasses?.created > 0 || r.exportedClasses?.updated > 0) {
        parts.push(`${(r.exportedClasses?.created || 0) + (r.exportedClasses?.updated || 0)} classes exported`);
      }

      const syncedMessage = parts.length > 0 ? `Synced ${parts.join(', ')}` : 'No new data to sync';
      setGoogleCalendarMessage(`✓ ${syncedMessage}`);

      // Refresh status
      const statusResponse = await fetch('/api/google-calendar/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setGoogleCalendarStatus(statusData);
      }

      // Refresh store data
      await loadFromDatabase();

      setGoogleCalendarSyncing(false);
      setTimeout(() => setGoogleCalendarMessage(''), 5000);
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      setGoogleCalendarMessage('✗ Sync failed. Please try again.');
      setGoogleCalendarSyncing(false);
      setTimeout(() => setGoogleCalendarMessage(''), 3000);
    }
  };

  const handleGoogleCalendarSyncSettingChange = async (setting: string, value: boolean) => {
    // Update local state immediately
    setGoogleCalendarStatus(prev => prev ? { ...prev, [setting]: value } : prev);

    // Save to server
    try {
      await fetch('/api/google-calendar/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: value }),
      });
    } catch (error) {
      console.error('Failed to save Google Calendar sync settings:', error);
    }
  };

  // Blackboard Integration Handlers
  const handleBlackboardConnect = async () => {
    if (!blackboardInstanceUrl.trim() || !blackboardAppKey.trim() || !blackboardAppSecret.trim()) {
      setBlackboardMessage('Please enter Blackboard instance URL, application key, and application secret');
      setTimeout(() => setBlackboardMessage(''), 3000);
      return;
    }

    setBlackboardConnecting(true);
    setBlackboardMessage('');

    try {
      const response = await fetch('/api/blackboard/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: blackboardInstanceUrl,
          applicationKey: blackboardAppKey,
          applicationSecret: blackboardAppSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBlackboardMessage(`✗ ${data.error || 'Failed to connect to Blackboard'}`);
        setBlackboardConnecting(false);
        setTimeout(() => setBlackboardMessage(''), 5000);
        return;
      }

      setBlackboardMessage(`✓ ${data.message}`);
      setBlackboardInstanceUrl('');
      setBlackboardAppKey('');
      setBlackboardAppSecret('');

      // Refresh Blackboard status
      const statusResponse = await fetch('/api/blackboard/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBlackboardStatus(statusData);

        // Automatically sync after successful connection
        setBlackboardMessage('✓ Connected! Starting initial sync...');
        try {
          const syncResponse = await fetch('/api/blackboard/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncCourses: statusData.syncCourses ?? true,
              syncAssignments: statusData.syncAssignments ?? true,
              syncGrades: statusData.syncGrades ?? true,
              syncEvents: statusData.syncEvents ?? true,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            setBlackboardMessage(`✓ Initial sync complete! ${syncResult.result?.courses?.created || 0} courses, ${syncResult.result?.assignments?.created || 0} assignments synced.`);

            // Refresh Blackboard status again to show last synced time
            const refreshResponse = await fetch('/api/blackboard/status');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setBlackboardStatus(refreshData);
            }

            // Reload the store data to show synced items
            const { loadFromDatabase } = useAppStore.getState();
            await loadFromDatabase();
          } else {
            setBlackboardMessage('✓ Connected! Initial sync may have had issues - you can try syncing manually.');
          }
        } catch (syncError) {
          console.error('Initial sync error:', syncError);
          setBlackboardMessage('✓ Connected! You can sync your data using the Sync Now button.');
        }
      }

      setBlackboardConnecting(false);
      setTimeout(() => setBlackboardMessage(''), 5000);
    } catch (error) {
      console.error('Blackboard connection error:', error);
      setBlackboardMessage('✗ Failed to connect to Blackboard. Please try again.');
      setBlackboardConnecting(false);
      setTimeout(() => setBlackboardMessage(''), 3000);
    }
  };

  const performBlackboardDisconnect = async () => {
    try {
      const response = await fetch('/api/blackboard/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setBlackboardStatus(null);
        setBlackboardMessage('✓ Successfully disconnected from Blackboard');
        setTimeout(() => setBlackboardMessage(''), 3000);
      } else {
        const data = await response.json();
        setBlackboardMessage(`✗ ${data.error || 'Failed to disconnect'}`);
        setTimeout(() => setBlackboardMessage(''), 3000);
      }
    } catch (error) {
      console.error('Blackboard disconnect error:', error);
      setBlackboardMessage('✗ Failed to disconnect. Please try again.');
      setTimeout(() => setBlackboardMessage(''), 3000);
    }
  };

  const handleBlackboardDisconnect = async () => {
    setShowBlackboardDisconnectModal(false);
    await performBlackboardDisconnect();
  };

  const handleBlackboardDisconnectClick = () => {
    if (confirmBeforeDelete) {
      setShowBlackboardDisconnectModal(true);
    } else {
      // Show toast with undo
      setPendingBlackboardDisconnect(true);

      // Clear any existing timeout
      if (pendingBlackboardDisconnectTimeout.current) {
        clearTimeout(pendingBlackboardDisconnectTimeout.current);
      }

      showDeleteToast('Blackboard disconnected', () => {
        // Undo - cancel the disconnect
        if (pendingBlackboardDisconnectTimeout.current) {
          clearTimeout(pendingBlackboardDisconnectTimeout.current);
          pendingBlackboardDisconnectTimeout.current = null;
        }
        setPendingBlackboardDisconnect(false);
      });

      // Schedule actual disconnect after toast duration
      pendingBlackboardDisconnectTimeout.current = setTimeout(async () => {
        await performBlackboardDisconnect();
        setPendingBlackboardDisconnect(false);
        pendingBlackboardDisconnectTimeout.current = null;
      }, 5000);
    }
  };

  const handleBlackboardSync = async () => {
    setBlackboardSyncing(true);
    setBlackboardMessage('');

    try {
      const response = await fetch('/api/blackboard/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCourses: blackboardSyncCourses,
          syncAssignments: blackboardSyncAssignments,
          syncGrades: blackboardSyncGrades,
          syncEvents: blackboardSyncEvents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBlackboardMessage(`✗ ${data.error || 'Sync failed'}`);
        setBlackboardSyncing(false);
        setTimeout(() => setBlackboardMessage(''), 5000);
        return;
      }

      // Build success message
      const result = data.result;
      const parts = [];
      if (blackboardSyncCourses && (result.courses.created > 0 || result.courses.updated > 0)) {
        parts.push(`${result.courses.created + result.courses.updated} courses`);
      }
      if (blackboardSyncAssignments && (result.assignments.created > 0 || result.assignments.updated > 0)) {
        parts.push(`${result.assignments.created + result.assignments.updated} assignments`);
      }
      if (blackboardSyncGrades && result.grades.updated > 0) {
        parts.push(`${result.grades.updated} grades`);
      }
      if (blackboardSyncEvents && (result.events.created > 0 || result.events.updated > 0)) {
        parts.push(`${result.events.created + result.events.updated} events`);
      }

      const syncedMessage = parts.length > 0 ? `Synced ${parts.join(', ')}` : 'No new data to sync';
      setBlackboardMessage(`✓ ${syncedMessage}`);

      // Refresh Blackboard status to get new lastSyncedAt
      const statusResponse = await fetch('/api/blackboard/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBlackboardStatus(statusData);
      }

      // Refresh store data so users see synced courses/deadlines/events immediately
      await loadFromDatabase();

      setBlackboardSyncing(false);
      setTimeout(() => setBlackboardMessage(''), 5000);
    } catch (error) {
      console.error('Blackboard sync error:', error);
      setBlackboardMessage('✗ Sync failed. Please try again.');
      setBlackboardSyncing(false);
      setTimeout(() => setBlackboardMessage(''), 3000);
    }
  };

  const handleBlackboardSyncSettingsChange = async (setting: string, value: boolean) => {
    // Update local state immediately
    switch (setting) {
      case 'courses': setBlackboardSyncCourses(value); break;
      case 'assignments': setBlackboardSyncAssignments(value); break;
      case 'grades': setBlackboardSyncGrades(value); break;
      case 'events': setBlackboardSyncEvents(value); break;
      case 'autoMarkComplete': setBlackboardAutoMarkComplete(value); break;
    }

    // Save to server
    try {
      // For autoMarkComplete, use camelCase directly; for others, prefix with 'sync'
      const key = setting === 'autoMarkComplete'
        ? 'autoMarkComplete'
        : `sync${setting.charAt(0).toUpperCase() + setting.slice(1)}`;

      await fetch('/api/blackboard/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to save Blackboard sync settings:', error);
    }
  };

  // Moodle Integration Handlers
  const handleMoodleConnect = async () => {
    if (!moodleInstanceUrl.trim() || !moodleToken.trim()) {
      setMoodleMessage('Please enter Moodle instance URL and web service token');
      setTimeout(() => setMoodleMessage(''), 3000);
      return;
    }

    setMoodleConnecting(true);
    setMoodleMessage('');

    try {
      const response = await fetch('/api/moodle/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: moodleInstanceUrl,
          token: moodleToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMoodleMessage(`✗ ${data.error || 'Failed to connect to Moodle'}`);
        setMoodleConnecting(false);
        setTimeout(() => setMoodleMessage(''), 5000);
        return;
      }

      setMoodleMessage(`✓ ${data.message}`);
      setMoodleInstanceUrl('');
      setMoodleToken('');

      // Refresh Moodle status
      const statusResponse = await fetch('/api/moodle/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setMoodleStatus(statusData);

        // Automatically sync after successful connection
        setMoodleMessage('✓ Connected! Starting initial sync...');
        try {
          const syncResponse = await fetch('/api/moodle/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncCourses: statusData.syncCourses ?? true,
              syncAssignments: statusData.syncAssignments ?? true,
              syncGrades: statusData.syncGrades ?? true,
              syncEvents: statusData.syncEvents ?? true,
              syncAnnouncements: statusData.syncAnnouncements ?? true,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            setMoodleMessage(`✓ Initial sync complete! ${syncResult.result?.courses?.created || 0} courses, ${syncResult.result?.assignments?.created || 0} assignments synced.`);

            // Refresh Moodle status again to show last synced time
            const refreshResponse = await fetch('/api/moodle/status');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setMoodleStatus(refreshData);
            }

            // Reload the store data to show synced items
            const { loadFromDatabase } = useAppStore.getState();
            await loadFromDatabase();
          } else {
            setMoodleMessage('✓ Connected! Initial sync may have had issues - you can try syncing manually.');
          }
        } catch (syncError) {
          console.error('Initial sync error:', syncError);
          setMoodleMessage('✓ Connected! You can sync your data using the Sync Now button.');
        }
      }

      setMoodleConnecting(false);
      setTimeout(() => setMoodleMessage(''), 5000);
    } catch (error) {
      console.error('Moodle connection error:', error);
      setMoodleMessage('✗ Failed to connect to Moodle. Please try again.');
      setMoodleConnecting(false);
      setTimeout(() => setMoodleMessage(''), 3000);
    }
  };

  const performMoodleDisconnect = async () => {
    try {
      const response = await fetch('/api/moodle/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setMoodleStatus(null);
        setMoodleMessage('✓ Successfully disconnected from Moodle');
        setTimeout(() => setMoodleMessage(''), 3000);
      } else {
        const data = await response.json();
        setMoodleMessage(`✗ ${data.error || 'Failed to disconnect'}`);
        setTimeout(() => setMoodleMessage(''), 3000);
      }
    } catch (error) {
      console.error('Moodle disconnect error:', error);
      setMoodleMessage('✗ Failed to disconnect. Please try again.');
      setTimeout(() => setMoodleMessage(''), 3000);
    }
  };

  const handleMoodleDisconnect = async () => {
    setShowMoodleDisconnectModal(false);
    await performMoodleDisconnect();
  };

  const handleMoodleDisconnectClick = () => {
    if (confirmBeforeDelete) {
      setShowMoodleDisconnectModal(true);
    } else {
      // Show toast with undo
      setPendingMoodleDisconnect(true);

      // Clear any existing timeout
      if (pendingMoodleDisconnectTimeout.current) {
        clearTimeout(pendingMoodleDisconnectTimeout.current);
      }

      showDeleteToast('Moodle disconnected', () => {
        // Undo - cancel the disconnect
        if (pendingMoodleDisconnectTimeout.current) {
          clearTimeout(pendingMoodleDisconnectTimeout.current);
          pendingMoodleDisconnectTimeout.current = null;
        }
        setPendingMoodleDisconnect(false);
      });

      // Schedule actual disconnect after toast duration
      pendingMoodleDisconnectTimeout.current = setTimeout(async () => {
        await performMoodleDisconnect();
        setPendingMoodleDisconnect(false);
        pendingMoodleDisconnectTimeout.current = null;
      }, 5000);
    }
  };

  const handleMoodleSync = async () => {
    setMoodleSyncing(true);
    setMoodleMessage('');

    try {
      const response = await fetch('/api/moodle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCourses: moodleSyncCourses,
          syncAssignments: moodleSyncAssignments,
          syncGrades: moodleSyncGrades,
          syncEvents: moodleSyncEvents,
          syncAnnouncements: moodleSyncAnnouncements,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMoodleMessage(`✗ ${data.error || 'Sync failed'}`);
        setMoodleSyncing(false);
        setTimeout(() => setMoodleMessage(''), 5000);
        return;
      }

      // Build success message
      const result = data.result;
      const parts = [];
      if (moodleSyncCourses && (result.courses.created > 0 || result.courses.updated > 0)) {
        parts.push(`${result.courses.created + result.courses.updated} courses`);
      }
      if (moodleSyncAssignments && (result.assignments.created > 0 || result.assignments.updated > 0)) {
        parts.push(`${result.assignments.created + result.assignments.updated} assignments`);
      }
      if (moodleSyncGrades && result.grades.updated > 0) {
        parts.push(`${result.grades.updated} grades`);
      }
      if (moodleSyncEvents && (result.events.created > 0 || result.events.updated > 0)) {
        parts.push(`${result.events.created + result.events.updated} events`);
      }
      if (moodleSyncAnnouncements && (result.announcements?.created > 0 || result.announcements?.updated > 0)) {
        parts.push(`${(result.announcements?.created || 0) + (result.announcements?.updated || 0)} announcements`);
      }

      const syncedMessage = parts.length > 0 ? `Synced ${parts.join(', ')}` : 'No new data to sync';
      setMoodleMessage(`✓ ${syncedMessage}`);

      // Refresh Moodle status to get new lastSyncedAt
      const statusResponse = await fetch('/api/moodle/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setMoodleStatus(statusData);
      }

      // Refresh store data so users see synced courses/deadlines/events immediately
      await loadFromDatabase();

      setMoodleSyncing(false);
      setTimeout(() => setMoodleMessage(''), 5000);
    } catch (error) {
      console.error('Moodle sync error:', error);
      setMoodleMessage('✗ Sync failed. Please try again.');
      setMoodleSyncing(false);
      setTimeout(() => setMoodleMessage(''), 3000);
    }
  };

  const handleMoodleSyncSettingsChange = async (setting: string, value: boolean) => {
    // Update local state immediately
    switch (setting) {
      case 'courses': setMoodleSyncCourses(value); break;
      case 'assignments': setMoodleSyncAssignments(value); break;
      case 'grades': setMoodleSyncGrades(value); break;
      case 'events': setMoodleSyncEvents(value); break;
      case 'announcements': setMoodleSyncAnnouncements(value); break;
      case 'autoMarkComplete': setMoodleAutoMarkComplete(value); break;
    }

    // Save to server
    try {
      // For autoMarkComplete, use camelCase directly; for others, prefix with 'sync'
      const key = setting === 'autoMarkComplete'
        ? 'autoMarkComplete'
        : `sync${setting.charAt(0).toUpperCase() + setting.slice(1)}`;

      await fetch('/api/moodle/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to save Moodle sync settings:', error);
    }
  };

  // Brightspace Integration Handlers
  const handleBrightspaceConnect = async () => {
    if (!brightspaceInstanceUrl.trim() || !brightspaceClientId.trim() || !brightspaceClientSecret.trim()) {
      setBrightspaceMessage('Please enter Brightspace instance URL, client ID, and client secret');
      setTimeout(() => setBrightspaceMessage(''), 3000);
      return;
    }

    setBrightspaceConnecting(true);
    setBrightspaceMessage('');

    try {
      const response = await fetch('/api/brightspace/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: brightspaceInstanceUrl,
          clientId: brightspaceClientId,
          clientSecret: brightspaceClientSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBrightspaceMessage(`✗ ${data.error || 'Failed to connect to Brightspace'}`);
        setBrightspaceConnecting(false);
        setTimeout(() => setBrightspaceMessage(''), 5000);
        return;
      }

      setBrightspaceMessage(`✓ ${data.message}`);
      setBrightspaceInstanceUrl('');
      setBrightspaceClientId('');
      setBrightspaceClientSecret('');

      // Refresh Brightspace status
      const statusResponse = await fetch('/api/brightspace/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBrightspaceStatus(statusData);

        // Automatically sync after successful connection
        setBrightspaceMessage('✓ Connected! Starting initial sync...');
        try {
          const syncResponse = await fetch('/api/brightspace/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncCourses: statusData.syncCourses ?? true,
              syncAssignments: statusData.syncAssignments ?? true,
              syncGrades: statusData.syncGrades ?? true,
              syncEvents: statusData.syncEvents ?? true,
              syncAnnouncements: statusData.syncAnnouncements ?? true,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            setBrightspaceMessage(`✓ Initial sync complete! ${syncResult.result?.courses?.created || 0} courses, ${syncResult.result?.assignments?.created || 0} assignments synced.`);

            // Refresh Brightspace status again to show last synced time
            const refreshResponse = await fetch('/api/brightspace/status');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setBrightspaceStatus(refreshData);
            }

            // Reload the store data to show synced items
            const { loadFromDatabase } = useAppStore.getState();
            await loadFromDatabase();
          } else {
            setBrightspaceMessage('✓ Connected! Initial sync may have had issues - you can try syncing manually.');
          }
        } catch (syncError) {
          console.error('Initial sync error:', syncError);
          setBrightspaceMessage('✓ Connected! You can sync your data using the Sync Now button.');
        }
      }

      setBrightspaceConnecting(false);
      setTimeout(() => setBrightspaceMessage(''), 5000);
    } catch (error) {
      console.error('Brightspace connection error:', error);
      setBrightspaceMessage('✗ Failed to connect to Brightspace. Please try again.');
      setBrightspaceConnecting(false);
      setTimeout(() => setBrightspaceMessage(''), 3000);
    }
  };

  const performBrightspaceDisconnect = async () => {
    try {
      const response = await fetch('/api/brightspace/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setBrightspaceStatus(null);
        setBrightspaceMessage('✓ Successfully disconnected from Brightspace');
        setTimeout(() => setBrightspaceMessage(''), 3000);
      } else {
        const data = await response.json();
        setBrightspaceMessage(`✗ ${data.error || 'Failed to disconnect'}`);
        setTimeout(() => setBrightspaceMessage(''), 3000);
      }
    } catch (error) {
      console.error('Brightspace disconnect error:', error);
      setBrightspaceMessage('✗ Failed to disconnect. Please try again.');
      setTimeout(() => setBrightspaceMessage(''), 3000);
    }
  };

  const handleBrightspaceDisconnect = async () => {
    setShowBrightspaceDisconnectModal(false);
    await performBrightspaceDisconnect();
  };

  const handleBrightspaceDisconnectClick = () => {
    if (confirmBeforeDelete) {
      setShowBrightspaceDisconnectModal(true);
    } else {
      // Show toast with undo
      setPendingBrightspaceDisconnect(true);

      // Clear any existing timeout
      if (pendingBrightspaceDisconnectTimeout.current) {
        clearTimeout(pendingBrightspaceDisconnectTimeout.current);
      }

      showDeleteToast('Brightspace disconnected', () => {
        // Undo - cancel the disconnect
        if (pendingBrightspaceDisconnectTimeout.current) {
          clearTimeout(pendingBrightspaceDisconnectTimeout.current);
          pendingBrightspaceDisconnectTimeout.current = null;
        }
        setPendingBrightspaceDisconnect(false);
      });

      // Schedule actual disconnect after toast duration
      pendingBrightspaceDisconnectTimeout.current = setTimeout(async () => {
        await performBrightspaceDisconnect();
        setPendingBrightspaceDisconnect(false);
        pendingBrightspaceDisconnectTimeout.current = null;
      }, 5000);
    }
  };

  const handleBrightspaceSync = async () => {
    setBrightspaceSyncing(true);
    setBrightspaceMessage('');

    try {
      const response = await fetch('/api/brightspace/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCourses: brightspaceSyncCourses,
          syncAssignments: brightspaceSyncAssignments,
          syncGrades: brightspaceSyncGrades,
          syncEvents: brightspaceSyncEvents,
          syncAnnouncements: brightspaceSyncAnnouncements,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBrightspaceMessage(`✗ ${data.error || 'Sync failed'}`);
        setBrightspaceSyncing(false);
        setTimeout(() => setBrightspaceMessage(''), 5000);
        return;
      }

      // Build success message
      const result = data.result;
      const parts = [];
      if (brightspaceSyncCourses && (result.courses.created > 0 || result.courses.updated > 0)) {
        parts.push(`${result.courses.created + result.courses.updated} courses`);
      }
      if (brightspaceSyncAssignments && (result.assignments.created > 0 || result.assignments.updated > 0)) {
        parts.push(`${result.assignments.created + result.assignments.updated} assignments`);
      }
      if (brightspaceSyncGrades && result.grades.updated > 0) {
        parts.push(`${result.grades.updated} grades`);
      }
      if (brightspaceSyncEvents && (result.events.created > 0 || result.events.updated > 0)) {
        parts.push(`${result.events.created + result.events.updated} events`);
      }
      if (brightspaceSyncAnnouncements && (result.announcements?.created > 0 || result.announcements?.updated > 0)) {
        parts.push(`${(result.announcements?.created || 0) + (result.announcements?.updated || 0)} announcements`);
      }

      const syncedMessage = parts.length > 0 ? `Synced ${parts.join(', ')}` : 'No new data to sync';
      setBrightspaceMessage(`✓ ${syncedMessage}`);

      // Refresh Brightspace status to get new lastSyncedAt
      const statusResponse = await fetch('/api/brightspace/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBrightspaceStatus(statusData);
      }

      // Refresh store data so users see synced courses/deadlines/events immediately
      await loadFromDatabase();

      setBrightspaceSyncing(false);
      setTimeout(() => setBrightspaceMessage(''), 5000);
    } catch (error) {
      console.error('Brightspace sync error:', error);
      setBrightspaceMessage('✗ Sync failed. Please try again.');
      setBrightspaceSyncing(false);
      setTimeout(() => setBrightspaceMessage(''), 3000);
    }
  };

  const handleBrightspaceSyncSettingsChange = async (setting: string, value: boolean) => {
    // Update local state immediately
    switch (setting) {
      case 'courses': setBrightspaceSyncCourses(value); break;
      case 'assignments': setBrightspaceSyncAssignments(value); break;
      case 'grades': setBrightspaceSyncGrades(value); break;
      case 'events': setBrightspaceSyncEvents(value); break;
      case 'announcements': setBrightspaceSyncAnnouncements(value); break;
      case 'autoMarkComplete': setBrightspaceAutoMarkComplete(value); break;
    }

    // Save to server
    try {
      // For autoMarkComplete, use camelCase directly; for others, prefix with 'sync'
      const key = setting === 'autoMarkComplete'
        ? 'autoMarkComplete'
        : `sync${setting.charAt(0).toUpperCase() + setting.slice(1)}`;

      await fetch('/api/brightspace/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to save Brightspace sync settings:', error);
    }
  };

  const formatLastSynced = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      {/* Settings Header */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            {effectiveVisualTheme === 'cartoon' ? "Make it your own." : "Customize your experience."}
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: isMobile ? '3px' : '8px', marginTop: '16px', marginBottom: '8px' }}>
          {[
            { key: 'appearance', label: 'Appearance' },
            { key: 'preferences', label: 'Preferences' },
            { key: 'integrations', label: 'Integrations' },
            { key: 'about', label: 'About' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSettingsTab(tab.key as typeof activeSettingsTab)}
              className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                activeSettingsTab === tab.key ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              style={{
                padding: isMobile ? '6px 8px' : '10px 18px',
                fontSize: isMobile ? '12px' : '14px',
                flex: isMobile ? 1 : undefined,
                border: 'none',
                backgroundColor: activeSettingsTab === tab.key ? accentColor : 'transparent',
                backgroundImage: activeSettingsTab === tab.key
                  ? (settings.theme === 'light'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                    : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)')
                  : 'none',
                boxShadow: activeSettingsTab === tab.key ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        {/* Desktop App - Hidden for now, uncomment when ready to release */}
        {false && isMacDesktop && (
          <div style={{ marginBottom: '24px' }}>
            <Card title="Desktop App">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <p className="text-sm text-[var(--text-muted)]" style={{ margin: 0, maxWidth: '600px' }}>
                    Download the native Mac app for a better desktop experience. The app runs in its own window without browser tabs or address bar.
                  </p>
                  <a
                    href="/downloads/College-Orbit.zip"
                    download
                    className="inline-flex items-center gap-2 font-medium text-sm transition-all duration-150"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                      borderRadius: 'var(--radius-control)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Monitor size={18} />
                    Download Mac App
                  </a>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-control)',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--text-muted)'
                }}>
                  <strong style={{ color: 'var(--text)' }}>First time opening?</strong> After unzipping, drag the app to Applications. If macOS blocks it, go to <strong>System Settings → Privacy &amp; Security</strong> and click &quot;Open Anyway&quot; next to the blocked app message.
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="w-full" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? '14px' : 'var(--grid-gap)', maxWidth: '100%', boxSizing: 'border-box' }}>
          {!session && sessionStatus !== 'loading' && (
            <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 'var(--radius-xs, 6px)', padding: '12px', marginBottom: '0px', color: '#856404', fontSize: '14px' }}>
              ⚠️ You are not logged in. Settings will be saved to your browser only.
            </div>
          )}
          {/* Preferences Tab - Date & Time */}
          {activeSettingsTab === 'preferences' && (
          <>
          <Card title="Date & Time">
            {/* Time Format */}
            <div style={{ marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Time Format</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: 'var(--radius-control, 12px)',
                border: '1px solid var(--border)',
              }}>
                {(['12h', '24h'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => updateSettings({ timeFormat: format })}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: settings.timeFormat === format ? 'var(--text)' : 'var(--text-muted)',
                      backgroundColor: settings.timeFormat === format ? 'var(--panel)' : 'transparent',
                      border: settings.timeFormat === format ? '1px solid var(--border)' : '1px solid transparent',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {format === '12h' ? '12-hour' : '24-hour'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[var(--text-muted)]" style={{ marginTop: '8px' }}>
                {settings.timeFormat === '12h' ? 'Example: 2:30 PM' : 'Example: 14:30'}
              </p>
            </div>

            {/* Date Format */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Date Format</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: 'var(--radius-control, 12px)',
                border: '1px solid var(--border)',
              }}>
                {(['MM/DD/YYYY', 'DD/MM/YYYY'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => updateSettings({ dateFormat: format })}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: settings.dateFormat === format ? 'var(--text)' : 'var(--text-muted)',
                      backgroundColor: settings.dateFormat === format ? 'var(--panel)' : 'transparent',
                      border: settings.dateFormat === format ? '1px solid var(--border)' : '1px solid transparent',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {format}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[var(--text-muted)]" style={{ marginTop: '8px' }}>
                {settings.dateFormat === 'MM/DD/YYYY' ? 'Example: 01/19/2026' : 'Example: 19/01/2026'}
              </p>
            </div>

            {/* Show Relative Dates */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Relative Dates</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display "Tomorrow" or "In 3 days" instead of actual dates
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showRelativeDates: !(settings.showRelativeDates ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showRelativeDates ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showRelativeDates ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Flashcards */}
          <div id="setting-flashcards">
          <Card title="Flashcards">
            {/* Dropdowns in two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {/* Default Study Mode */}
              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Default Study Mode</p>
                <select
                  value={settings.flashcardDefaultMode ?? 'flashcard'}
                  onChange={(e) => updateSettings({ flashcardDefaultMode: e.target.value as 'flashcard' | 'type' | 'match' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius-xs, 8px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="flashcard">Flashcards</option>
                  <option value="type">Type Answer</option>
                  <option value="match">Match</option>
                </select>
              </div>

              {/* Cards per Session */}
              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Cards per Session</p>
                <select
                  value={settings.flashcardCardsPerSession ?? 20}
                  onChange={(e) => updateSettings({ flashcardCardsPerSession: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius-xs, 8px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="10">10 cards</option>
                  <option value="20">20 cards</option>
                  <option value="50">50 cards</option>
                  <option value="0">All cards</option>
                </select>
              </div>

              {/* Daily Goal */}
              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Daily Goal</p>
                <select
                  value={settings.flashcardDailyGoal ?? 20}
                  onChange={(e) => updateSettings({ flashcardDailyGoal: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius-xs, 8px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="10">10 cards</option>
                  <option value="20">20 cards</option>
                  <option value="30">30 cards</option>
                  <option value="50">50 cards</option>
                  <option value="100">100 cards</option>
                </select>
              </div>

              {/* Auto-flip Delay */}
              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Auto-flip Delay</p>
                <select
                  value={settings.flashcardAutoFlipDelay ?? 0}
                  onChange={(e) => updateSettings({ flashcardAutoFlipDelay: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius-xs, 8px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="0">Off</option>
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                </select>
              </div>

              {/* Default Sort Order */}
              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Default Sort Order</p>
                <select
                  value={settings.flashcardDefaultSort ?? 'recent'}
                  onChange={(e) => updateSettings({ flashcardDefaultSort: e.target.value as 'recent' | 'due' | 'alphabetical' | 'course' | 'mastery' | 'created' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius-xs, 8px)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="recent">Recently studied</option>
                  <option value="due">Most cards due</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="course">By course</option>
                  <option value="mastery">Mastery level</option>
                  <option value="created">Recently created</option>
                </select>
              </div>
            </div>

            {/* Shuffle Cards */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Shuffle Cards</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Randomize the order of cards during study
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ flashcardShuffleOrder: !(settings.flashcardShuffleOrder ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.flashcardShuffleOrder ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.flashcardShuffleOrder ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Show Keyboard Hints */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Keyboard Hints</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display keyboard shortcut hints during study sessions
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ flashcardShowKeyboardHints: !(settings.flashcardShowKeyboardHints ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.flashcardShowKeyboardHints ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.flashcardShowKeyboardHints ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sound Effects */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Sound Effects</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Play sounds during study sessions
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ flashcardSoundEffects: !(settings.flashcardSoundEffects ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.flashcardSoundEffects ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.flashcardSoundEffects ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Celebration Animations */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Celebration Animations</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Show confetti and animations when completing study sessions
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ flashcardCelebrations: !(settings.flashcardCelebrations ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.flashcardCelebrations ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.flashcardCelebrations ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          </Card>
          </div>

          {/* Display Options */}
          <Card title="Display Options">
            {/* Show Course Code vs Name */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Course Code</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display course code (e.g., CS 101) instead of full name
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showCourseCode: !(settings.showCourseCode ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showCourseCode ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showCourseCode ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Show LMS Badges */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show LMS Integration Badges</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display LMS markers on synced courses and assignments
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showCanvasBadges: !(settings.showCanvasBadges ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showCanvasBadges ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showCanvasBadges ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Show Priority Indicators */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Priority Indicators</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display priority badges on tasks
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showPriorityIndicators: !(settings.showPriorityIndicators ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showPriorityIndicators ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showPriorityIndicators ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Show Effort Indicators */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Effort Indicators</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display effort level badges on assignments
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showEffortIndicators: !(settings.showEffortIndicators ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showEffortIndicators ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showEffortIndicators ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Show Nav Counts */}
            <div id="setting-nav-counts" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Item Counts in Nav</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display badge counts on sidebar items
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showNavCounts: !(settings.showNavCounts ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.showNavCounts ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.showNavCounts ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Sub-options when enabled */}
              {(settings.showNavCounts ?? false) && (
                <div style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid var(--border)' }}>
                  {/* Work count toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p className="text-sm text-[var(--text)]" style={{ margin: 0 }}>Work</p>
                      <HelpTooltip text="Shows count of overdue work items" size={14} width={200} />
                    </div>
                    <button
                      onClick={() => updateSettings({ showNavCountTasks: !(settings.showNavCountTasks ?? true) })}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: (settings.showNavCountTasks ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: (settings.showNavCountTasks ?? true) ? '18px' : '2px',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>

                  {/* Exams count toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p className="text-sm text-[var(--text)]" style={{ margin: 0 }}>Exams</p>
                      <HelpTooltip text="Shows total number of exams" size={14} width={180} />
                    </div>
                    <button
                      onClick={() => updateSettings({ showNavCountExams: !(settings.showNavCountExams ?? true) })}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: (settings.showNavCountExams ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: (settings.showNavCountExams ?? true) ? '18px' : '2px',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* List Organization */}
          <Card title="List Organization">
            {/* Group Work by Course */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Group Work by Course</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Auto-group work items by course in list view
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ groupTasksByCourse: !(settings.groupTasksByCourse ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.groupTasksByCourse ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.groupTasksByCourse ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

          </Card>

          {/* Behavior */}
          <Card title="Behavior">
            {/* Confirm Before Delete */}
            <div id="setting-confirm-delete" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Confirm Before Delete</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Show confirmation dialogs before deleting items
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ confirmBeforeDelete: !(settings.confirmBeforeDelete ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.confirmBeforeDelete ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.confirmBeforeDelete ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Enable Keyboard Shortcuts */}
            <div id="setting-keyboard-shortcuts" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Enable Keyboard Shortcuts</p>
                    <HelpTooltip text="Press ? anywhere in the app to see all available shortcuts. Includes navigation (g+d for Dashboard), quick actions (n for new item), and more." size={14} width={240} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Toggle keyboard navigation and action shortcuts
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ enableKeyboardShortcuts: !(settings.enableKeyboardShortcuts ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.enableKeyboardShortcuts ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.enableKeyboardShortcuts ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Auto-sync Courses to Grade Tracker */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Auto-sync Courses to Grade Tracker</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Automatically add courses to Grade Tracker when created or updated
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ autoSyncCoursesToGradeTracker: !(settings.autoSyncCoursesToGradeTracker ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.autoSyncCoursesToGradeTracker ?? true) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.autoSyncCoursesToGradeTracker ?? true) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Streaks & Gamification */}
          <Card title="Streak">
            {/* Vacation Mode */}
            <div id="setting-vacation-mode">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Vacation Mode</p>
                    <HelpTooltip text="Enable vacation mode during breaks to pause your streak. Your streak will be preserved and resume when you turn this off." size={14} width={240} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Pause your streak during semester breaks or vacations
                  </p>
                </div>
                <button
                  onClick={handleToggleVacationMode}
                  disabled={vacationModeLoading || !session?.user}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: vacationMode ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: vacationModeLoading || !session?.user ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                    opacity: vacationModeLoading || !session?.user ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: vacationMode ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
              {vacationMode && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--accent-light)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  border: '1px solid var(--accent)',
                }}>
                  <p className="text-sm text-[var(--link)]" style={{ margin: 0, fontWeight: 500 }}>
                    Your streak is currently paused. Completing tasks will still earn XP, but your streak won&apos;t be affected until you turn vacation mode off.
                  </p>
                </div>
              )}
              {!session?.user && (
                <p className="text-sm text-[var(--text-muted)]" style={{ marginTop: '8px' }}>
                  Sign in to manage your streak settings
                </p>
              )}
            </div>
          </Card>

          {/* Beta Program */}
          <Card title="Beta Program">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Beta Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Join Beta Program</p>
                    <div ref={betaWarningRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBetaWarningOpen(!betaWarningOpen);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'help',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                        aria-label="Warning"
                      >
                        <AlertCircle size={15} />
                      </button>
                      {betaWarningOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bottom: '100%',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--text)',
                            backgroundColor: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            whiteSpace: 'normal',
                            width: '240px',
                            textAlign: 'left',
                            lineHeight: '1.4',
                            zIndex: 50,
                          }}
                        >
                          Beta features are experimental and may be unstable. Data loss or unexpected behavior is possible. We recommend backing up important information.
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Get early access to new features and help shape College Orbit
                  </p>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newValue = !(settings.isBetaUser ?? false);
                    await updateSettings({ isBetaUser: newValue });
                  }}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.isBetaUser ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.isBetaUser ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Beta Feedback Form (only visible when enrolled) */}
              {(settings.isBetaUser ?? false) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Submit Beta Feedback</p>
                  <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                    Share your thoughts, report bugs, or suggest improvements for beta features
                  </p>
                  <textarea
                    value={betaFeedbackText}
                    onChange={(e) => setBetaFeedbackText(e.target.value)}
                    placeholder="Describe your feedback, bug report, or suggestion..."
                    maxLength={1000}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      boxSizing: 'border-box',
                      marginBottom: '0',
                      resize: 'vertical',
                    }}
                    disabled={betaFeedbackLoading}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {betaFeedbackText.length}/1000 characters
                  </p>
                  <Button
                    disabled={!betaFeedbackText.trim() || betaFeedbackLoading}
                    onClick={async () => {
                      if (!betaFeedbackText.trim()) return;
                      setBetaFeedbackLoading(true);
                      setBetaFeedbackMessage('');
                      try {
                        const response = await fetch('/api/beta-feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ description: betaFeedbackText.trim() }),
                        });
                        if (response.ok) {
                          setBetaFeedbackText('');
                          setBetaFeedbackMessage('Feedback submitted successfully! Thank you for helping improve College Orbit.');
                          setTimeout(() => setBetaFeedbackMessage(''), 5000);
                        } else {
                          const data = await response.json();
                          setBetaFeedbackMessage(data.error || 'Failed to submit feedback. Please try again.');
                        }
                      } catch {
                        setBetaFeedbackMessage('Failed to submit feedback. Please try again.');
                      } finally {
                        setBetaFeedbackLoading(false);
                      }
                    }}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {betaFeedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                  {betaFeedbackMessage && (
                    <p
                      style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        color: betaFeedbackMessage.includes('Error') || betaFeedbackMessage.includes('Failed') ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      {betaFeedbackMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
          </>
          )}

          {/* Integrations Tab - LMS Integrations */}
          {activeSettingsTab === 'integrations' && (
          <>
          {/* Browser Extension Card */}
          <div style={{ gridColumn: '1 / -1' }}>
          <a
            href="https://chromewebstore.google.com/detail/college-orbit-quick-add/ocngjdkipbabcfoehkpcifpfiidbilhb"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 24px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control, 12px)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.backgroundColor = 'var(--panel-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = 'var(--panel)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-control, 12px)',
              flexShrink: 0,
            }}>
              <Chrome size={24} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text)',
              }}>
                Browser Extension
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: 'var(--text-muted)',
              }}>
                Quickly add deadlines from Canvas and Learning Suite without leaving your browser
              </p>
            </div>
            <ExternalLink size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </a>
          </div>

          {/* Google Calendar Integration Card */}
          <div id="setting-google-calendar" style={{ gridColumn: '1 / -1' }}>
          <Card title="Google Calendar Sync">
            {!googleCalendarStatus?.connected ? (
              // Not Connected State
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Sync your Google Calendar with College Orbit. Import Google events and export your deadlines, exams, and events back to Google Calendar.
                </p>

                {!isPremium && !isLoadingSubscription ? (
                  <UpgradePrompt feature="Google Calendar Sync" />
                ) : (
                  <>
                    <Button
                      size={isMobile ? 'sm' : 'lg'}
                      onClick={handleGoogleCalendarConnect}
                      disabled={googleCalendarConnecting}
                      style={{
                        paddingLeft: isMobile ? '12px' : '16px',
                        paddingRight: isMobile ? '12px' : '16px',
                      }}
                    >
                      {googleCalendarConnecting ? (
                        <>
                          <RefreshCw size={16} className="animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Calendar size={16} className="mr-2" />
                          Connect Google Calendar
                        </>
                      )}
                    </Button>
                  </>
                )}

                {googleCalendarMessage && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: googleCalendarMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {googleCalendarMessage}
                  </p>
                )}
              </div>
            ) : (
              // Connected State
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                  }} />
                  <span className="text-sm text-[var(--text)]">
                    Connected as <strong>{googleCalendarStatus.email}</strong>
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Last synced: {formatLastSynced(googleCalendarStatus.lastSyncedAt)}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleGoogleCalendarSync}
                    disabled={googleCalendarSyncing}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {googleCalendarSyncing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    variant="secondary"
                    onClick={handleGoogleCalendarDisconnectClick}
                    disabled={pendingGoogleCalendarDisconnect}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                      boxShadow: 'none',
                      opacity: pendingGoogleCalendarDisconnect ? 0.5 : 1,
                    }}
                  >
                    <Unlink size={16} className="mr-2" />
                    {pendingGoogleCalendarDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>

                {/* Message display */}
                {googleCalendarMessage && (
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: googleCalendarMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {googleCalendarMessage}
                  </p>
                )}

                {/* Sync Settings Dropdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button
                    onClick={() => setGoogleCalendarSyncSettingsOpen(!googleCalendarSyncSettingsOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Sync Settings
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: googleCalendarSyncSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>
                  {googleCalendarSyncSettingsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { key: 'syncImportEvents', label: 'Import Events', description: 'Import Google Calendar events', value: googleCalendarStatus.syncImportEvents },
                        { key: 'syncExportEvents', label: 'Export Events', description: 'Export calendar events to Google', value: googleCalendarStatus.syncExportEvents },
                        { key: 'syncExportDeadlines', label: 'Export Deadlines', description: 'Export deadlines to Google', value: googleCalendarStatus.syncExportDeadlines },
                        { key: 'syncExportExams', label: 'Export Exams', description: 'Export exams to Google', value: googleCalendarStatus.syncExportExams },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>{setting.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{setting.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleGoogleCalendarSyncSettingChange(setting.key, e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>

          <div style={{
            gridColumn: '1 / -1',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '24px',
            alignItems: 'stretch',
          }}>
          <div id="setting-canvas">
          <Card title="Canvas LMS Integration">
            {!canvasStatus?.connected ? (
              // Not Connected State
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Connect your Canvas LMS account to sync courses, assignments, grades, and more.
                </p>

                {/* Canvas Instance URL */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Canvas Instance URL</p>
                    <HelpTooltip text="Your school's Canvas domain (e.g., school.instructure.com)" size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={canvasInstanceUrl}
                    onChange={(e) => setCanvasInstanceUrl(e.target.value)}
                    placeholder="school.instructure.com"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={canvasConnecting}
                  />
                </div>

                {/* API Access Token */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>API Access Token</p>
                    <HelpTooltip text="Generate in Canvas: Account → Settings → New Access Token. Never share this token." size={14} width={260} />
                  </div>
                  <input
                    type="password"
                    value={canvasAccessToken}
                    onChange={(e) => setCanvasAccessToken(e.target.value)}
                    placeholder="Paste your access token"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={canvasConnecting}
                  />
                </div>

                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleCanvasConnect}
                  disabled={canvasConnecting || !canvasInstanceUrl.trim() || !canvasAccessToken.trim()}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {canvasConnecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} className="mr-2" />
                      Connect to Canvas
                    </>
                  )}
                </Button>

                {/* Message display */}
                {canvasMessage && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: canvasMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {canvasMessage}
                  </p>
                )}
              </div>
            ) : (
              // Connected State
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                  }} />
                  <span className="text-sm text-[var(--text)]">
                    Connected as <strong>{canvasStatus.userName}</strong>
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Last synced: {formatLastSynced(canvasStatus.lastSyncedAt)}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleCanvasSync}
                    disabled={canvasSyncing}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {canvasSyncing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    variant="secondary"
                    onClick={handleCanvasDisconnectClick}
                    disabled={pendingDisconnect}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                      boxShadow: 'none',
                      opacity: pendingDisconnect ? 0.5 : 1,
                    }}
                  >
                    <Unlink size={16} className="mr-2" />
                    {pendingDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>

                {/* Message display */}
                {canvasMessage && (
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: canvasMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {canvasMessage}
                  </p>
                )}

                {/* Sync Settings Dropdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button
                    onClick={() => setCanvasSyncSettingsOpen(!canvasSyncSettingsOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Sync Settings
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: canvasSyncSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>
                  {canvasSyncSettingsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { key: 'courses', label: 'Courses', description: 'Creates courses from Canvas', value: canvasSyncCourses },
                        { key: 'assignments', label: 'Assignments', description: 'Syncs to Work page', value: canvasSyncAssignments },
                        { key: 'grades', label: 'Grades', description: 'Updates assignment scores', value: canvasSyncGrades },
                        { key: 'events', label: 'Calendar Events', description: 'Syncs to Calendar', value: canvasSyncEvents },
                        { key: 'announcements', label: 'Announcements', description: 'Creates notifications', value: canvasSyncAnnouncements },
                        { key: 'autoMarkComplete', label: 'Auto-mark complete', description: 'Mark assignments done when submitted', value: canvasAutoMarkComplete },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>{setting.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{setting.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleCanvasSyncSettingsChange(setting.key, e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Moodle LMS Integration */}
          <div id="setting-moodle">
          <Card title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Moodle Integration
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--warning)',
                backgroundColor: 'var(--warning-bg)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs, 4px)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Beta
              </span>
            </span>
          }>
            {!moodleStatus?.connected ? (
              // Not Connected State
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Connect your Moodle account to sync courses, assignments, grades, events, and announcements.
                  <br />
                  <span style={{ color: 'var(--warning)', fontSize: '12px' }}>
                    Note: This integration is in beta. Please report any issues.
                  </span>
                </p>

                {/* Moodle Instance URL */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Moodle Instance URL</p>
                    <HelpTooltip text="Your school's Moodle domain (e.g., moodle.school.edu)" size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={moodleInstanceUrl}
                    onChange={(e) => setMoodleInstanceUrl(e.target.value)}
                    placeholder="moodle.school.edu"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={moodleConnecting}
                  />
                </div>

                {/* Web Service Token */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Web Service Token</p>
                    <HelpTooltip text="Get your token from Moodle: Profile → Security Keys → Service (Mobile web service). Never share this token." size={14} width={300} />
                  </div>
                  <input
                    type="password"
                    value={moodleToken}
                    onChange={(e) => setMoodleToken(e.target.value)}
                    placeholder="Your web service token"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={moodleConnecting}
                  />
                </div>

                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleMoodleConnect}
                  disabled={moodleConnecting || !moodleInstanceUrl.trim() || !moodleToken.trim()}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {moodleConnecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} className="mr-2" />
                      Connect to Moodle
                    </>
                  )}
                </Button>

                {/* Message display */}
                {moodleMessage && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: moodleMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {moodleMessage}
                  </p>
                )}
              </div>
            ) : (
              // Connected State
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                  }} />
                  <span className="text-sm text-[var(--text)]">
                    Connected as <strong>{moodleStatus.userName}</strong>
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Last synced: {formatLastSynced(moodleStatus.lastSyncedAt)}
                </p>

                <p className="text-xs" style={{ marginBottom: '16px', color: 'var(--warning)' }}>
                  This integration is in beta. If you encounter issues, please report them in Settings → Feedback.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleMoodleSync}
                    disabled={moodleSyncing}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {moodleSyncing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    variant="secondary"
                    onClick={handleMoodleDisconnectClick}
                    disabled={pendingMoodleDisconnect}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                      boxShadow: 'none',
                      opacity: pendingMoodleDisconnect ? 0.5 : 1,
                    }}
                  >
                    <Unlink size={16} className="mr-2" />
                    {pendingMoodleDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>

                {/* Message display */}
                {moodleMessage && (
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: moodleMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {moodleMessage}
                  </p>
                )}

                {/* Sync Settings Dropdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button
                    onClick={() => setMoodleSyncSettingsOpen(!moodleSyncSettingsOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Sync Settings
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: moodleSyncSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>
                  {moodleSyncSettingsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { key: 'courses', label: 'Courses', description: 'Creates courses from Moodle', value: moodleSyncCourses },
                        { key: 'assignments', label: 'Assignments', description: 'Syncs assignments to Work page', value: moodleSyncAssignments },
                        { key: 'grades', label: 'Grades', description: 'Updates assignment scores', value: moodleSyncGrades },
                        { key: 'events', label: 'Calendar Events', description: 'Syncs to Calendar', value: moodleSyncEvents },
                        { key: 'announcements', label: 'Announcements', description: 'Syncs forum posts', value: moodleSyncAnnouncements },
                        { key: 'autoMarkComplete', label: 'Auto-mark complete', description: 'Mark assignments done when submitted', value: moodleAutoMarkComplete },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>{setting.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{setting.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleMoodleSyncSettingsChange(setting.key, e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Blackboard LMS Integration */}
          <div id="setting-blackboard">
          <Card title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Blackboard Learn Integration
              <HelpTooltip text="Requires institutional setup. Ask your school's IT department for API credentials (Application Key and Secret)." size={14} width={280} />
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--warning)',
                backgroundColor: 'var(--warning-bg)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs, 4px)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Beta
              </span>
            </span>
          }>
            {!blackboardStatus?.connected ? (
              // Not Connected State
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Connect your Blackboard Learn account to sync courses, assignments, grades, and more.
                  <br />
                  <span style={{ color: 'var(--warning)', fontSize: '12px' }}>
                    Note: This integration is in beta. Please report any issues.
                  </span>
                </p>

                {/* Blackboard Instance URL */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Blackboard Instance URL</p>
                    <HelpTooltip text="Your school's Blackboard domain (e.g., school.blackboard.com)" size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={blackboardInstanceUrl}
                    onChange={(e) => setBlackboardInstanceUrl(e.target.value)}
                    placeholder="school.blackboard.com"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={blackboardConnecting}
                  />
                </div>

                {/* Application Key */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Application Key</p>
                    <HelpTooltip text="Create a REST API integration in Blackboard Admin Panel to get your application key." size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={blackboardAppKey}
                    onChange={(e) => setBlackboardAppKey(e.target.value)}
                    placeholder="Your application key"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={blackboardConnecting}
                  />
                </div>

                {/* Application Secret */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Application Secret</p>
                    <HelpTooltip text="The secret key from your Blackboard REST API integration. Never share this secret." size={14} width={280} />
                  </div>
                  <input
                    type="password"
                    value={blackboardAppSecret}
                    onChange={(e) => setBlackboardAppSecret(e.target.value)}
                    placeholder="Your application secret"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={blackboardConnecting}
                  />
                </div>

                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleBlackboardConnect}
                  disabled={blackboardConnecting || !blackboardInstanceUrl.trim() || !blackboardAppKey.trim() || !blackboardAppSecret.trim()}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {blackboardConnecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} className="mr-2" />
                      Connect to Blackboard
                    </>
                  )}
                </Button>

                {/* Message display */}
                {blackboardMessage && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: blackboardMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {blackboardMessage}
                  </p>
                )}
              </div>
            ) : (
              // Connected State
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                  }} />
                  <span className="text-sm text-[var(--text)]">
                    Connected as <strong>{blackboardStatus.userName}</strong>
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Last synced: {formatLastSynced(blackboardStatus.lastSyncedAt)}
                </p>

                <p className="text-xs" style={{ marginBottom: '16px', color: 'var(--warning)' }}>
                  This integration is in beta. If you encounter issues, please report them in Settings → Feedback.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleBlackboardSync}
                    disabled={blackboardSyncing}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {blackboardSyncing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    variant="secondary"
                    onClick={handleBlackboardDisconnectClick}
                    disabled={pendingBlackboardDisconnect}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                      boxShadow: 'none',
                      opacity: pendingBlackboardDisconnect ? 0.5 : 1,
                    }}
                  >
                    <Unlink size={16} className="mr-2" />
                    {pendingBlackboardDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>

                {/* Message display */}
                {blackboardMessage && (
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: blackboardMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {blackboardMessage}
                  </p>
                )}

                {/* Sync Settings Dropdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button
                    onClick={() => setBlackboardSyncSettingsOpen(!blackboardSyncSettingsOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Sync Settings
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: blackboardSyncSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>
                  {blackboardSyncSettingsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { key: 'courses', label: 'Courses', description: 'Creates courses from Blackboard', value: blackboardSyncCourses },
                        { key: 'assignments', label: 'Assignments', description: 'Syncs gradebook columns to Work page', value: blackboardSyncAssignments },
                        { key: 'grades', label: 'Grades', description: 'Updates assignment scores', value: blackboardSyncGrades },
                        { key: 'events', label: 'Calendar Events', description: 'Syncs to Calendar', value: blackboardSyncEvents },
                        { key: 'autoMarkComplete', label: 'Auto-mark complete', description: 'Mark assignments done when submitted', value: blackboardAutoMarkComplete },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>{setting.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{setting.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleBlackboardSyncSettingsChange(setting.key, e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Brightspace (D2L) LMS Integration */}
          <div id="setting-brightspace">
          <Card title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Brightspace (D2L) Integration
              <HelpTooltip text="Requires institutional setup. Ask your school's IT department for OAuth credentials (Client ID and Secret)." size={14} width={280} />
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--warning)',
                backgroundColor: 'var(--warning-bg)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs, 4px)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Beta
              </span>
            </span>
          }>
            {!brightspaceStatus?.connected ? (
              // Not Connected State
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Connect your Brightspace (D2L) account to sync courses, assignments, grades, events, and announcements.
                  <br />
                  <span style={{ color: 'var(--warning)', fontSize: '12px' }}>
                    Note: This integration is in beta. Please report any issues.
                  </span>
                </p>

                {/* Brightspace Instance URL */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Brightspace Instance URL</p>
                    <HelpTooltip text="Your school's Brightspace domain (e.g., school.brightspace.com)" size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={brightspaceInstanceUrl}
                    onChange={(e) => setBrightspaceInstanceUrl(e.target.value)}
                    placeholder="school.brightspace.com"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={brightspaceConnecting}
                  />
                </div>

                {/* Client ID */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Client ID</p>
                    <HelpTooltip text="Create an OAuth 2.0 application in Brightspace Admin to get your Client ID." size={14} width={280} />
                  </div>
                  <input
                    type="text"
                    value={brightspaceClientId}
                    onChange={(e) => setBrightspaceClientId(e.target.value)}
                    placeholder="Your client ID"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={brightspaceConnecting}
                  />
                </div>

                {/* Client Secret */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Client Secret</p>
                    <HelpTooltip text="The secret key from your Brightspace OAuth 2.0 application. Never share this secret." size={14} width={280} />
                  </div>
                  <input
                    type="password"
                    value={brightspaceClientSecret}
                    onChange={(e) => setBrightspaceClientSecret(e.target.value)}
                    placeholder="Your client secret"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={brightspaceConnecting}
                  />
                </div>

                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleBrightspaceConnect}
                  disabled={brightspaceConnecting || !brightspaceInstanceUrl.trim() || !brightspaceClientId.trim() || !brightspaceClientSecret.trim()}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {brightspaceConnecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} className="mr-2" />
                      Connect to Brightspace
                    </>
                  )}
                </Button>

                {/* Message display */}
                {brightspaceMessage && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: brightspaceMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {brightspaceMessage}
                  </p>
                )}
              </div>
            ) : (
              // Connected State
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-xs, 8px)',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                  }} />
                  <span className="text-sm text-[var(--text)]">
                    Connected as <strong>{brightspaceStatus.userName}</strong>
                  </span>
                </div>

                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Last synced: {formatLastSynced(brightspaceStatus.lastSyncedAt)}
                </p>

                <p className="text-xs" style={{ marginBottom: '16px', color: 'var(--warning)' }}>
                  This integration is in beta. If you encounter issues, please report them in Settings → Feedback.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleBrightspaceSync}
                    disabled={brightspaceSyncing}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                    }}
                  >
                    {brightspaceSyncing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    variant="secondary"
                    onClick={handleBrightspaceDisconnectClick}
                    disabled={pendingBrightspaceDisconnect}
                    style={{
                      paddingLeft: isMobile ? '12px' : '16px',
                      paddingRight: isMobile ? '12px' : '16px',
                      boxShadow: 'none',
                      opacity: pendingBrightspaceDisconnect ? 0.5 : 1,
                    }}
                  >
                    <Unlink size={16} className="mr-2" />
                    {pendingBrightspaceDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>

                {/* Message display */}
                {brightspaceMessage && (
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: brightspaceMessage.includes('✗') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {brightspaceMessage}
                  </p>
                )}

                {/* Sync Settings Dropdown */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button
                    onClick={() => setBrightspaceSyncSettingsOpen(!brightspaceSyncSettingsOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Sync Settings
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: brightspaceSyncSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </button>
                  {brightspaceSyncSettingsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { key: 'courses', label: 'Courses', description: 'Creates courses from Brightspace', value: brightspaceSyncCourses },
                        { key: 'assignments', label: 'Assignments', description: 'Syncs dropbox folders to Work page', value: brightspaceSyncAssignments },
                        { key: 'grades', label: 'Grades', description: 'Updates assignment scores', value: brightspaceSyncGrades },
                        { key: 'events', label: 'Calendar Events', description: 'Syncs to Calendar', value: brightspaceSyncEvents },
                        { key: 'announcements', label: 'Announcements', description: 'Syncs news items', value: brightspaceSyncAnnouncements },
                        { key: 'autoMarkComplete', label: 'Auto-mark complete', description: 'Mark assignments done when submitted', value: brightspaceAutoMarkComplete },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: 'var(--radius-xs, 6px)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>{setting.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{setting.description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleBrightspaceSyncSettingsChange(setting.key, e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>
          </div>
          </>
          )}

          {/* Appearance Tab */}
          {activeSettingsTab === 'appearance' && (
            <>
          {/* Appearance - Theme, University, Custom Theme + Visual Effects */}
          <Card title="Appearance">
            {/* Theme */}
            <div id="setting-theme" style={{ marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Theme</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '6px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: 'var(--radius-card, 16px)',
                border: '1px solid var(--border)',
              }}>
                {(['light', 'dark'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => {
                      setSelectedTheme(themeOption);
                      updateSettings({ theme: themeOption });
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: selectedTheme === themeOption ? 'var(--text)' : 'var(--text-muted)',
                      backgroundColor: selectedTheme === themeOption ? 'var(--panel)' : 'transparent',
                      border: selectedTheme === themeOption ? '1px solid var(--border)' : '1px solid transparent',
                      borderRadius: 'var(--radius-xs, 6px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* University */}
            <div id="setting-university" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>University</p>
              <select
                value={university || ''}
                onChange={(e) => {
                  const newUniversity = e.target.value || null;
                  setUniversity(newUniversity);
                  updateSettings({ university: newUniversity });
                }}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '18px',
                  paddingRight: '36px',
                }}
              >
                <option value="">Select a University</option>
                {collegesList.map((college) => (
                  <option key={college.fullName} value={college.fullName}>
                    {college.fullName}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '12px' }}>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Don't see yours? Request it to be added
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={collegeRequestName}
                    onChange={(e) => setCollegeRequestName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitCollegeRequest();
                      }
                    }}
                    placeholder="University name"
                    maxLength={100}
                    style={{
                      flex: 1,
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs, 6px)',
                    }}
                    disabled={collegeRequestLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitCollegeRequest}
                    disabled={collegeRequestLoading}
                  >
                    {collegeRequestLoading ? '...' : 'Request'}
                  </Button>
                </div>
                {collegeRequestMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: collegeRequestMessage.includes('✗') ? 'var(--danger)' : 'var(--success)' }}>{collegeRequestMessage}</p>
                )}
              </div>
            </div>

            {/* Custom Theme Toggle */}
            <div id="setting-custom-theme" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '0' }}>
              {!isPremium && !isLoadingSubscription && (
                <div style={{ marginBottom: '16px' }}>
                  <UpgradePrompt feature="Custom themes and visual effects" />
                </div>
              )}
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Color Theme</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: 'var(--radius-control, 12px)',
                border: '1px solid var(--border)',
                opacity: isPremium ? 1 : 0.5,
              }}>
                <button
                  onClick={() => {
                    if (!isPremium) return;
                    setUseCustomTheme(false);
                    updateSettings({ useCustomTheme: false });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: !effectiveUseCustomTheme ? 'var(--text)' : 'var(--text-muted)',
                    backgroundColor: !effectiveUseCustomTheme ? 'var(--panel)' : 'transparent',
                    border: !effectiveUseCustomTheme ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-xs, 6px)',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                >
                  College Theme
                </button>
                <button
                  onClick={() => {
                    if (!isPremium) return;
                    setUseCustomTheme(true);
                    const colors = customColors || getDefaultCustomColors(university);
                    setCustomColors(colors);
                    updateSettings({ useCustomTheme: true, customColors: colors });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: effectiveUseCustomTheme ? 'var(--text)' : 'var(--text-muted)',
                    backgroundColor: effectiveUseCustomTheme ? 'var(--panel)' : 'transparent',
                    border: effectiveUseCustomTheme ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-xs, 6px)',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                >
                  Custom Theme
                </button>
              </div>
            </div>

            {/* Color Pickers */}
            {isPremium && useCustomTheme && customColors && (() => {
              const currentThemeMode = selectedTheme;
              const currentColorSet = currentThemeMode === 'light' ? customColors.light : customColors.dark;

              const updateColor = (key: keyof CustomColorSet, value: string) => {
                const newColors = {
                  ...customColors,
                  [currentThemeMode]: { ...currentColorSet, [key]: value },
                };
                setCustomColors(newColors);
                updateSettings({ customColors: newColors });
              };

              return (
              <div style={{ marginBottom: '20px' }}>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Editing colors for {currentThemeMode} mode
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                  <ColorPicker label="Primary" value={currentColorSet.accent} onChange={(color) => updateColor('accent', color)} />
                  <ColorPicker label="Links" value={currentColorSet.link} onChange={(color) => updateColor('link', color)} />
                  <ColorPicker label="Success" value={currentColorSet.success} onChange={(color) => updateColor('success', color)} />
                  <ColorPicker label="Warning" value={currentColorSet.warning} onChange={(color) => updateColor('warning', color)} />
                  <ColorPicker label="Danger" value={currentColorSet.danger} onChange={(color) => updateColor('danger', color)} />
                  <ColorPicker label="Delete Buttons" value={currentColorSet.deleteButton || (currentThemeMode === 'light' ? '#dc2626' : '#660000')} onChange={(color) => updateColor('deleteButton', color)} />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const defaultColors = getDefaultCustomColors(university);
                    setCustomColors(defaultColors);
                    updateSettings({ customColors: defaultColors });
                  }}
                  style={{ marginTop: '12px', boxShadow: 'none' }}
                >
                  Reset Colors
                </Button>
              </div>
              );
            })()}

            {/* Visual Theme Picker */}
            <div id="setting-visual-theme" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Visual Theme</p>
              <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                Fun, personality-driven themes with unique colors and styles
              </p>
              <select
                value={settings.visualTheme || 'default'}
                onChange={(e) => {
                  if (!isPremium) return;
                  updateSettings({ visualTheme: e.target.value });
                }}
                disabled={!isPremium}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control, 12px)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: isPremium ? 'pointer' : 'not-allowed',
                  opacity: isPremium ? 1 : 0.5,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="default">Default — Clean & minimal</option>
                <option value="random">Random — A new theme every day</option>
                <optgroup label="Calm & Relaxing">
                  <option value="cozy">Cozy — Fireflies & candlelight</option>
                  <option value="nature">Nature — Earthy & calming</option>
                  <option value="ocean">Ocean — Coastal & serene</option>
                  <option value="lavender">Lavender — Soft & dreamy</option>
                  <option value="aquarium">Aquarium — Swimming fish & bubbles</option>
                </optgroup>
                <optgroup label="Seasonal">
                  <option value="spring">Spring — Butterflies & fresh blooms</option>
                  <option value="sakura">Sakura — Cherry blossoms & soft pinks</option>
                  <option value="autumn">Autumn — Crisp leaves & harvest warmth</option>
                  <option value="winter">Winter — Snowflakes & aurora</option>
                  <option value="halloween">Halloween — Bats, pumpkins & cobwebs</option>
                </optgroup>
                <optgroup label="Fun & Playful">
                  <option value="cartoon">Cartoon — Bright & playful</option>
                  <option value="pixel">Pixel — 8-bit retro gaming</option>
                  <option value="paper">Paper — Notebook with doodles</option>
                  <option value="jungle">Jungle — Tropical wilds & parrots</option>
                </optgroup>
                <optgroup label="Aesthetic">
                  <option value="noir">Noir — Cinematic shadows & gold</option>
                  <option value="lofi">Lo-fi — Soft pastels & analog vibes</option>
                  <option value="glass">Glass — Frosted panels & translucent blur</option>
                  <option value="skeuo">Skeuomorphism — Textured surfaces & tactile depth</option>
                </optgroup>
                <optgroup label="Tech & Futuristic">
                  <option value="cyberpunk">Cyberpunk — Neon & futuristic</option>
                  <option value="retro">Retro — 80s synthwave</option>
                  <option value="steampunk">Steampunk — Brass gears & Victorian industry</option>
                  <option value="space">Space — Cosmic & stellar</option>
                  <option value="terminal">Terminal — Matrix rain & hacker vibes</option>
                </optgroup>
              </select>
              {settings.visualTheme === 'random' && isPremium && (
                <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: '8px' }}>
                  Today&apos;s theme: <span className="font-medium text-[var(--accent)]">{getVisualTheme('random').name}</span>
                </p>
              )}
            </div>

            {/* Pet Companion */}
            <div id="setting-pet-companion" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px', marginBottom: (settings.petCompanion ?? false) && isPremium ? '20px' : '12px', opacity: isPremium ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (settings.petCompanion ?? false) && isPremium ? '12px' : '0px' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Pet Companion</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    A pixel art pet that walks along the bottom of your screen
                  </p>
                </div>
                <button
                  onClick={() => isPremium && updateSettings({ petCompanion: !(settings.petCompanion ?? false) })}
                  disabled={!isPremium}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: 'var(--radius-control, 12px)',
                    backgroundColor: (settings.petCompanion ?? false) ? 'var(--accent)' : 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: (settings.petCompanion ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
              {(settings.petCompanion ?? false) && isPremium && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
                  {(Object.keys(sprites) as AnimalType[]).map((animal) => {
                    const animalData = sprites[animal];
                    if (!animalData) return null;
                    return (
                      <button
                        key={animal}
                        onClick={() => updateSettings({ petCompanionAnimal: animal })}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 4px 6px',
                          borderRadius: 'var(--radius-control, 12px)',
                          border: `2px solid ${(settings.petCompanionAnimal || 'rottweiler') === animal ? 'var(--accent)' : 'var(--border)'}`,
                          backgroundColor: (settings.petCompanionAnimal || 'rottweiler') === animal ? 'var(--accent-faint, rgba(var(--accent-rgb, 99,102,241), 0.1))' : 'var(--panel-2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <PetSprite sprite={animalData.idle} size={animalPreviewSize[animal] ?? 48} />
                        </div>
                        <span className="text-xs text-[var(--text)]" style={{ fontWeight: (settings.petCompanionAnimal || 'rottweiler') === animal ? 600 : 400 }}>
                          {animalLabels[animal]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!isPremium && (
                <div style={{ marginTop: '8px' }}>
                  <UpgradePrompt feature="Pet companion" />
                </div>
              )}
            </div>

            {/* Visual Effects */}
            <div id="setting-gradient-intensity" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', opacity: isPremium ? 1 : 0.5 }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>Visual Effects</p>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-sm text-[var(--text)]">Gradient Intensity</span>
                  <span className="text-sm text-[var(--text-muted)]">{localGradientIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localGradientIntensity}
                  onChange={(e) => isPremium && handleGradientChange(parseInt(e.target.value))}
                  disabled={!isPremium}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${localGradientIntensity}%, var(--border) ${localGradientIntensity}%, var(--border) 100%)`,
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
              <div id="setting-glow-intensity">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-sm text-[var(--text)]">Glow Intensity</span>
                  <span className="text-sm text-[var(--text-muted)]">{localGlowIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localGlowIntensity}
                  onChange={(e) => isPremium && handleGlowChange(parseInt(e.target.value))}
                  disabled={!isPremium}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${localGlowIntensity}%, var(--border) ${localGlowIntensity}%, var(--border) 100%)`,
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
            </div>

            {/* Colorblind Mode */}
            <div id="setting-colorblind-mode" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>Colorblind Mode</p>
                <HelpTooltip text="Protanopia: difficulty seeing red. Deuteranopia: difficulty seeing green. Tritanopia: difficulty seeing blue. Achromatopsia: complete color blindness. Choose your type for optimized colors. Note: May not work well with visual themes." size={14} width={260} />
              </div>
              <select
                value={settings.colorblindMode || ''}
                onChange={(e) => {
                  const newMode = e.target.value || null;
                  updateSettings({ colorblindMode: newMode as any });
                }}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '18px',
                  paddingRight: '36px',
                }}
              >
                <option value="">Off</option>
                <option value="protanopia">Protanopia (Red-Blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                <option value="achromatopsia">Achromatopsia (Monochromacy)</option>
              </select>
              <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: '6px' }}>
                Adjusts colors to be more distinguishable for different types of color vision deficiency
              </p>

              {/* Custom theme override notice */}
              {settings.colorblindMode && effectiveUseCustomTheme && (
                <p className="text-xs" style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-xs, 6px)', border: '1px solid var(--warning)' }}>
                  Custom Theme is enabled, so colorblind color adjustments won't apply. Patterns will still work if selected.
                </p>
              )}

              {/* Color Preview */}
              {settings.colorblindMode && !effectiveUseCustomTheme && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', border: '1px solid var(--border)' }}>
                  <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>Status Colors:</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span data-status="success" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>Success</span>
                    <span data-status="warning" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>Warning</span>
                    <span data-status="danger" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>Danger</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>Event Colors (Calendar & Timeline):</p>
                  {(() => {
                    const eventColors = getEventTypeColors(
                      settings.colorblindMode as any,
                      (settings.theme || 'dark') as 'light' | 'dark',
                      settings.colorblindStyle as any
                    );
                    return (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span data-event-type="course" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.course}26`, color: eventColors.course, border: `1px solid ${eventColors.course}` }}>Course</span>
                        <span data-event-type="task" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.task}26`, color: eventColors.task, border: `1px solid ${eventColors.task}` }}>Task</span>
                        <span data-event-type="exam" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.exam}26`, color: eventColors.exam, border: `1px solid ${eventColors.exam}` }}>Exam</span>
                        <span data-event-type="deadline" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.deadline}26`, color: eventColors.deadline, border: `1px solid ${eventColors.deadline}` }}>Assignment</span>
                        <span data-event-type="event" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.event}26`, color: eventColors.event, border: `1px solid ${eventColors.event}` }}>Event</span>
                        <span data-event-type="reading" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.reading}26`, color: eventColors.reading, border: `1px solid ${eventColors.reading}` }}>Reading</span>
                        <span data-event-type="project" style={{ position: 'relative', padding: '4px 8px', borderRadius: 'var(--radius-xs, 4px)', fontSize: '12px', fontWeight: '500', backgroundColor: `${eventColors.project}26`, color: eventColors.project, border: `1px solid ${eventColors.project}` }}>Project</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Colorblind Style - only show when mode is selected */}
              {settings.colorblindMode && (
                <div style={{ marginTop: '16px' }}>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Assistance Style</p>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {([
                      { value: 'palette', label: 'Color Palette', description: 'Replaces colors with colorblind-friendly alternatives' },
                      { value: 'patterns', label: 'Patterns & Icons', description: 'Adds patterns and icons to help distinguish elements' },
                      { value: 'both', label: 'Both', description: 'Combines color changes with patterns for maximum clarity' },
                    ] as const).map((option) => (
                      <label
                        key={option.value}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: (settings.colorblindStyle || 'palette') === option.value ? 'var(--panel-2)' : 'transparent',
                          border: '1px solid',
                          borderColor: (settings.colorblindStyle || 'palette') === option.value ? 'var(--accent)' : 'var(--border)',
                          borderRadius: 'var(--radius-xs, 8px)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="colorblindStyle"
                          value={option.value}
                          checked={(settings.colorblindStyle || 'palette') === option.value}
                          onChange={(e) => {
                            updateSettings({ colorblindStyle: e.target.value as any });
                          }}
                          style={{
                            marginTop: '2px',
                            accentColor: 'var(--accent)',
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{option.label}</p>
                          <p className="text-xs text-[var(--text-muted)]">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Page & Card Visibility */}
          <Card title="Page & Card Visibility">
            {/* Premium upgrade prompt */}
            {!isPremium && !isLoadingSubscription && (
              <div style={{ marginBottom: '16px' }}>
                <UpgradePrompt feature="Page & card visibility customization" />
              </div>
            )}

            {/* Tab selector for customization sections */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              opacity: isPremium ? 1 : 0.5,
              pointerEvents: isPremium ? 'auto' : 'none',
            }}>
              {[
                { id: 'pages', label: 'Pages' },
                ...(isMobile ? [] : [{ id: 'tools', label: 'Tools' }]),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => isPremium && setActiveCustomizationTab(tab.id as 'pages' | 'tools')}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    activeCustomizationTab === tab.id ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeCustomizationTab === tab.id ? 'var(--accent)' : 'transparent',
                    backgroundImage: activeCustomizationTab === tab.id
                      ? (settings.theme === 'light'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                        : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)')
                      : 'none',
                    boxShadow: activeCustomizationTab === tab.id ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                    border: 'none',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pages Customization */}
            {activeCustomizationTab === 'pages' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Drag to reorder pages or uncheck to hide them from navigation
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingIndex === null || dragOverIndex === null) return;
                    if (draggingIndex !== dragOverIndex) {
                      const newOrder = [...visiblePagesOrder];
                      const [draggedItem] = newOrder.splice(draggingIndex, 1);
                      const insertIndex = draggingIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                      newOrder.splice(insertIndex, 0, draggedItem);
                      setVisiblePagesOrder(newOrder);
                    }
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  {visiblePagesOrder.map((page, index) => {
                    const isDragging = draggingIndex === index;
                    // Calculate if this item should shift up or down
                    let translateY = 0;
                    if (draggingIndex !== null && dragOverIndex !== null && !isDragging) {
                      const itemHeight = 48; // Approximate height of each item including gap
                      if (draggingIndex < dragOverIndex) {
                        // Dragging downward: items between dragging and dragOver shift up
                        if (index > draggingIndex && index < dragOverIndex) {
                          translateY = -itemHeight;
                        }
                      } else if (draggingIndex > dragOverIndex) {
                        // Dragging upward: items between dragOver and dragging shift down
                        if (index >= dragOverIndex && index < draggingIndex) {
                          translateY = itemHeight;
                        }
                      }
                    }

                    return (
                      <div
                        key={page}
                        data-page={page}
                        draggable
                        onDragStart={(e) => {
                          setDragOverIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', index.toString());

                          // Create custom drag image with glow effect
                          const dragEl = e.currentTarget.cloneNode(true) as HTMLElement;
                          dragEl.style.backgroundColor = 'var(--accent-2)';
                          dragEl.style.border = '1px solid var(--accent)';
                          dragEl.style.boxShadow = '0 0 12px var(--accent)';
                          dragEl.style.opacity = '0.9';
                          dragEl.style.transform = 'scale(1.02)';
                          dragEl.style.position = 'absolute';
                          dragEl.style.top = '-9999px';
                          dragEl.style.width = `${e.currentTarget.offsetWidth}px`;
                          document.body.appendChild(dragEl);
                          e.dataTransfer.setDragImage(dragEl, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          requestAnimationFrame(() => {
                            document.body.removeChild(dragEl);
                            setDraggingIndex(index);
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';

                          const rect = e.currentTarget.getBoundingClientRect();
                          const midpoint = rect.top + rect.height / 2;
                          const targetIndex = e.clientY < midpoint ? index : index + 1;

                          if (dragOverIndex !== targetIndex) {
                            setDragOverIndex(targetIndex);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

                          if (draggedIndex !== dragOverIndex && dragOverIndex !== null) {
                            const newOrder = [...visiblePagesOrder];
                            const [draggedItem] = newOrder.splice(draggedIndex, 1);
                            const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                            newOrder.splice(insertIndex, 0, draggedItem);
                            setVisiblePagesOrder(newOrder);
                          }
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: isDragging ? 'var(--accent-2)' : 'var(--panel-2)',
                          borderRadius: 'var(--radius-xs, 8px)',
                          border: isDragging ? '1px solid var(--accent)' : '1px solid var(--border)',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          transform: `translateY(${translateY}px)`,
                          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease, border-color 0.15s ease',
                          opacity: isDragging ? 0 : 1,
                          boxShadow: 'none',
                          zIndex: isDragging ? 10 : 1,
                          position: 'relative',
                          pointerEvents: isDragging ? 'none' : 'auto',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visiblePages.includes(page)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisiblePages([...visiblePages, page]);
                            } else {
                              setVisiblePages(visiblePages.filter((p) => p !== page));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                          {page}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                          <circle cx="5" cy="3" r="1.5" />
                          <circle cx="11" cy="3" r="1.5" />
                          <circle cx="5" cy="8" r="1.5" />
                          <circle cx="11" cy="8" r="1.5" />
                          <circle cx="5" cy="13" r="1.5" />
                          <circle cx="11" cy="13" r="1.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisiblePages(DEFAULT_VISIBLE_PAGES);
                    setVisiblePagesOrder(Object.values(PAGES).filter(p => p !== 'Settings'));
                  }}
                  style={{
                    marginTop: '16px',
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    boxShadow: 'none',
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {/* Tools Cards Customization */}
            {activeCustomizationTab === 'tools' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Choose which tools to show on the Tools page
                </p>

                {/* Productivity Section */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Productivity
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      TOOLS_CARDS.POMODORO_TIMER,
                      TOOLS_CARDS.QUICK_LINKS,
                      TOOLS_CARDS.FILE_CONVERTER,
                      TOOLS_CARDS.UNIT_CONVERTER,
                      TOOLS_CARDS.WORD_COUNTER,
                      TOOLS_CARDS.CITATION_GENERATOR,
                    ].map((cardId) => (
                      <label
                        key={cardId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: 'var(--radius-xs, 8px)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleToolsCards.includes(cardId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleToolsCards([...visibleToolsCards, cardId]);
                            } else {
                              setVisibleToolsCards(visibleToolsCards.filter((c) => c !== cardId));
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1 }}>
                          {CARD_LABELS[cardId] || cardId}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Study Section */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Study
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[TOOLS_CARDS.FLASHCARDS].map((cardId) => (
                      <label
                        key={cardId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: 'var(--radius-xs, 8px)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleToolsCards.includes(cardId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleToolsCards([...visibleToolsCards, cardId]);
                            } else {
                              setVisibleToolsCards(visibleToolsCards.filter((c) => c !== cardId));
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1 }}>
                          {CARD_LABELS[cardId] || cardId}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Grades & GPA Section */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Grades & GPA
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      TOOLS_CARDS.GRADE_TRACKER,
                      TOOLS_CARDS.GPA_TREND_CHART,
                      TOOLS_CARDS.WHAT_IF_PROJECTOR,
                      TOOLS_CARDS.FINAL_GRADE_CALCULATOR,
                      TOOLS_CARDS.GPA_CALCULATOR,
                    ].map((cardId) => (
                      <label
                        key={cardId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: 'var(--radius-xs, 8px)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleToolsCards.includes(cardId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleToolsCards([...visibleToolsCards, cardId]);
                            } else {
                              setVisibleToolsCards(visibleToolsCards.filter((c) => c !== cardId));
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1 }}>
                          {CARD_LABELS[cardId] || cardId}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisibleToolsCards(DEFAULT_VISIBLE_TOOLS_CARDS);
                  }}
                  style={{
                    marginTop: '16px',
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    boxShadow: 'none',
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {/* Save Button */}
            <Button
              size={isMobile ? 'sm' : 'lg'}
              disabled={!isPremium}
              onClick={async () => {
                if (!isPremium) return;
                try {
                  await updateSettings({
                    visiblePages,
                    visibleToolsCards,
                    visiblePagesOrder,
                  });
                  setVisibilityMessage('Saved successfully!');
                  setTimeout(() => setVisibilityMessage(''), 3000);
                } catch (error) {
                  setVisibilityMessage('Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  setTimeout(() => setVisibilityMessage(''), 3000);
                }
              }}
              style={{
                marginTop: '24px',
                paddingLeft: isMobile ? '12px' : '16px',
                paddingRight: isMobile ? '12px' : '16px',
              }}
            >
              Save Visibility Settings
            </Button>
            {visibilityMessage && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: visibilityMessage.includes('Error') ? 'var(--danger)' : 'var(--success)',
                }}
              >
                {visibilityMessage}
              </p>
            )}
          </Card>
            </>
          )}

          {/* Preferences Tab - Notification Preferences */}
          {activeSettingsTab === 'preferences' && (
          <div id="setting-notifications" style={{ gridColumn: '1 / -1' }}>
          <Card
            title="Notification Preferences"
            action={
              <button
                onClick={() => setNotificationPrefsExpanded(!notificationPrefsExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronDown
                  size={20}
                  style={{
                    transform: notificationPrefsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            }
          >
            {!notificationPrefsExpanded && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Configure email and in-app notification settings for reminders and alerts.
              </p>
            )}
            {notificationPrefsExpanded && (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '20px' : '24px' }}>
              {/* Email Column */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>
                  Email
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Announcements</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Updates and news from College Orbit</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAnnouncements}
                      onChange={async (e) => {
                        setEmailAnnouncements(e.target.checked);
                        await updateSettings({ emailAnnouncements: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Account Alerts</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Password changes and security alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAccountAlerts}
                      onChange={async (e) => {
                        setEmailAccountAlerts(e.target.checked);
                        await updateSettings({ emailAccountAlerts: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Exam Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before upcoming exams</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailExamReminders}
                      onChange={async (e) => {
                        setEmailExamReminders(e.target.checked);
                        await updateSettings({ emailExamReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Assignment Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before assignment due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailDeadlineReminders}
                      onChange={async (e) => {
                        setEmailDeadlineReminders(e.target.checked);
                        await updateSettings({ emailDeadlineReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Task Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before task due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailTaskReminders}
                      onChange={async (e) => {
                        setEmailTaskReminders(e.target.checked);
                        await updateSettings({ emailTaskReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Reading Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before reading due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailReadingReminders}
                      onChange={async (e) => {
                        setEmailReadingReminders(e.target.checked);
                        await updateSettings({ emailReadingReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Project Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before project due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailProjectReminders}
                      onChange={async (e) => {
                        setEmailProjectReminders(e.target.checked);
                        await updateSettings({ emailProjectReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Weekly Digest</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Summary of upcoming work, exams, and deadlines</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailWeeklyDigest}
                      onChange={async (e) => {
                        setEmailWeeklyDigest(e.target.checked);
                        await updateSettings({ emailWeeklyDigest: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                </div>
              </div>

              {/* In-App Column */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>
                  In-App
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Announcements</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Updates and news from College Orbit</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyAnnouncements}
                      onChange={async (e) => {
                        setNotifyAnnouncements(e.target.checked);
                        await updateSettings({ notifyAnnouncements: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Account Alerts</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Subscription and payment notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyAccountAlerts}
                      onChange={async (e) => {
                        setNotifyAccountAlerts(e.target.checked);
                        await updateSettings({ notifyAccountAlerts: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Exam Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before upcoming exams</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyExamReminders}
                      onChange={async (e) => {
                        setNotifyExamReminders(e.target.checked);
                        await updateSettings({ notifyExamReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Assignment Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before assignment due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyDeadlineReminders}
                      onChange={async (e) => {
                        setNotifyDeadlineReminders(e.target.checked);
                        await updateSettings({ notifyDeadlineReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Task Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before task due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyTaskReminders}
                      onChange={async (e) => {
                        setNotifyTaskReminders(e.target.checked);
                        await updateSettings({ notifyTaskReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Reading Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before reading due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyReadingReminders}
                      onChange={async (e) => {
                        setNotifyReadingReminders(e.target.checked);
                        await updateSettings({ notifyReadingReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Project Reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before project due dates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyProjectReminders}
                      onChange={async (e) => {
                        setNotifyProjectReminders(e.target.checked);
                        await updateSettings({ notifyProjectReminders: e.target.checked });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Reminder Timing Section */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <button
                onClick={() => setReminderTimingOpen(!reminderTimingOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'left',
                }}
              >
                <span>Reminder Timing</span>
                <ChevronDown
                  size={18}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: reminderTimingOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-muted)',
                  }}
                />
              </button>

              {reminderTimingOpen && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                  {/* Exam Reminders */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Exam Reminders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {examReminders.map((reminder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={reminder.enabled}
                            onChange={async (e) => {
                              const newReminders = [...examReminders];
                              newReminders[index] = { ...reminder, enabled: e.target.checked };
                              setExamReminders(newReminders);
                              await updateSettings({ examReminders: newReminders });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                          <input
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 1;
                              const newReminders = [...examReminders];
                              newReminders[index] = { ...reminder, value };
                              setExamReminders(newReminders);
                              await updateSettings({ examReminders: newReminders });
                            }}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={async (e) => {
                              const newReminders = [...examReminders];
                              newReminders[index] = { ...reminder, unit: e.target.value as 'hours' | 'days' };
                              setExamReminders(newReminders);
                              await updateSettings({ examReminders: newReminders });
                            }}
                            style={{
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          >
                            <option value="hours">hours before</option>
                            <option value="days">days before</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assignment Reminders */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Assignment Reminders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {deadlineReminders.map((reminder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={reminder.enabled}
                            onChange={async (e) => {
                              const newReminders = [...deadlineReminders];
                              newReminders[index] = { ...reminder, enabled: e.target.checked };
                              setDeadlineReminders(newReminders);
                              await updateSettings({ deadlineReminders: newReminders });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                          <input
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 1;
                              const newReminders = [...deadlineReminders];
                              newReminders[index] = { ...reminder, value };
                              setDeadlineReminders(newReminders);
                              await updateSettings({ deadlineReminders: newReminders });
                            }}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={async (e) => {
                              const newReminders = [...deadlineReminders];
                              newReminders[index] = { ...reminder, unit: e.target.value as 'hours' | 'days' };
                              setDeadlineReminders(newReminders);
                              await updateSettings({ deadlineReminders: newReminders });
                            }}
                            style={{
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          >
                            <option value="hours">hours before</option>
                            <option value="days">days before</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Task Reminders */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Task Reminders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {taskReminders.map((reminder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={reminder.enabled}
                            onChange={async (e) => {
                              const newReminders = [...taskReminders];
                              newReminders[index] = { ...reminder, enabled: e.target.checked };
                              setTaskReminders(newReminders);
                              await updateSettings({ taskReminders: newReminders });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                          <input
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 1;
                              const newReminders = [...taskReminders];
                              newReminders[index] = { ...reminder, value };
                              setTaskReminders(newReminders);
                              await updateSettings({ taskReminders: newReminders });
                            }}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={async (e) => {
                              const newReminders = [...taskReminders];
                              newReminders[index] = { ...reminder, unit: e.target.value as 'hours' | 'days' };
                              setTaskReminders(newReminders);
                              await updateSettings({ taskReminders: newReminders });
                            }}
                            style={{
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          >
                            <option value="hours">hours before</option>
                            <option value="days">days before</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reading Reminders */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Reading Reminders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {readingReminders.map((reminder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={reminder.enabled}
                            onChange={async (e) => {
                              const newReminders = [...readingReminders];
                              newReminders[index] = { ...reminder, enabled: e.target.checked };
                              setReadingReminders(newReminders);
                              await updateSettings({ readingReminders: newReminders });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                          <input
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 1;
                              const newReminders = [...readingReminders];
                              newReminders[index] = { ...reminder, value };
                              setReadingReminders(newReminders);
                              await updateSettings({ readingReminders: newReminders });
                            }}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={async (e) => {
                              const newReminders = [...readingReminders];
                              newReminders[index] = { ...reminder, unit: e.target.value as 'hours' | 'days' };
                              setReadingReminders(newReminders);
                              await updateSettings({ readingReminders: newReminders });
                            }}
                            style={{
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          >
                            <option value="hours">hours before</option>
                            <option value="days">days before</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Reminders */}
                  <div style={{ padding: '16px', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-xs, 8px)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Project Reminders</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projectReminders.map((reminder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={reminder.enabled}
                            onChange={async (e) => {
                              const newReminders = [...projectReminders];
                              newReminders[index] = { ...reminder, enabled: e.target.checked };
                              setProjectReminders(newReminders);
                              await updateSettings({ projectReminders: newReminders });
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colorPalette.accent }}
                          />
                          <input
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 1;
                              const newReminders = [...projectReminders];
                              newReminders[index] = { ...reminder, value };
                              setProjectReminders(newReminders);
                              await updateSettings({ projectReminders: newReminders });
                            }}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={async (e) => {
                              const newReminders = [...projectReminders];
                              newReminders[index] = { ...reminder, unit: e.target.value as 'hours' | 'days' };
                              setProjectReminders(newReminders);
                              await updateSettings({ projectReminders: newReminders });
                            }}
                            style={{
                              padding: '6px 8px',
                              fontSize: '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs, 4px)',
                            }}
                          >
                            <option value="hours">hours before</option>
                            <option value="days">days before</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
            )}
          </Card>
          </div>
          )}

          {/* About Tab */}
          {activeSettingsTab === 'about' && (
            <>
          {/* Report an Issue & Request a Feature/Change */}
          <Card title="Feedback">
            <div className="space-y-4">
              {/* Request a Feature/Change */}
              <div id="setting-feature-request">
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Request a Feature/Change
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Have an idea for a new feature or change? We'd love to hear it!
                </p>
                <textarea
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  placeholder="Describe the feature or change you'd like to see..."
                  maxLength={1000}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs, 6px)',
                    boxSizing: 'border-box',
                    marginBottom: '0',
                    resize: 'vertical',
                  }}
                  disabled={featureRequestLoading}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {featureDescription.length} / 1000 characters
                </p>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleSubmitFeatureRequest}
                  disabled={featureRequestLoading}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    marginBottom: '20px'
                  }}
                >
                  {featureRequestLoading ? 'Submitting...' : 'Request Feature/Change'}
                </Button>
                {featureRequestMessage && (
                  <p style={{ marginTop: '8px', marginBottom: '20px', fontSize: '14px', color: featureRequestMessage.includes('✗') ? 'var(--danger)' : 'var(--success)' }}>{featureRequestMessage}</p>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}></div>

              {/* Report an Issue */}
              <div id="setting-report-issue">
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Report an Issue
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Found a bug or have a problem? Let us know
                </p>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  maxLength={1000}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs, 6px)',
                    boxSizing: 'border-box',
                    marginBottom: '0',
                    resize: 'vertical',
                  }}
                  disabled={issueReportLoading}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {issueDescription.length} / 1000 characters
                </p>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleSubmitIssueReport}
                  disabled={issueReportLoading}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {issueReportLoading ? 'Submitting...' : 'Report Issue'}
                </Button>
                {issueReportMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: issueReportMessage.includes('✗') ? 'var(--danger)' : 'var(--success)' }}>{issueReportMessage}</p>
                )}
              </div>
            </div>
          </Card>

          {/* About */}
          <Card title="About">
            <div>
              {/* Keyboard Shortcuts */}
              <div style={{ paddingBottom: '18px' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Keyboard Shortcuts
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Press <kbd style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '22px',
                    padding: '0 6px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs, 4px)',
                    color: 'var(--text)',
                    marginLeft: '4px',
                    marginRight: '4px',
                  }}>?</kbd> anywhere to view all available shortcuts
                </p>
              </div>
              {/* Tutorial Section */}
              <div style={{ paddingTop: '18px', paddingBottom: '18px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Tutorial
                </p>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  New to College Orbit? Take a quick tour of the app.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    updateSettings({ hasCompletedOnboarding: false });
                    window.location.href = '/';
                  }}
                >
                  Restart Tutorial
                </Button>
              </div>
              {/* Help & FAQs Section */}
              <div style={{ paddingTop: '18px', paddingBottom: '18px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Help & FAQs
                </p>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Learn how everything works and find answers to common questions.
                </p>
                <Link
                  href="/help"
                  className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  View Help Center
                </Link>
              </div>
              {/* Contact Section */}
              <div style={{ paddingTop: '18px', paddingBottom: '18px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Contact
                </p>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Questions, feedback, or issues? Reach out anytime.
                </p>
                <button
                  onClick={() => setShowEmailConfirm(true)}
                  className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  collegeorbit@protonmail.com
                </button>
              </div>
              {/* Legal Section */}
              <div style={{ paddingTop: '18px', paddingBottom: '18px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Legal
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Terms of Service
                  </a>
                </div>
              </div>
              {/* Branding */}
              <div className="space-y-3 text-sm" style={{ paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <p className="font-semibold text-[var(--text)]">College Orbit</p>
                  <p className="text-[var(--text-muted)]">{currentVersion}</p>
                  <Link
                    href="/release-notes"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ marginTop: '4px', display: 'inline-block' }}
                  >
                    View Release Notes
                  </Link>
                </div>
                <p className="text-[var(--text-secondary)]">
                  A personal, privacy-first dashboard for students to manage courses, work, and notes.
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  Your data is stored securely on our servers. We do not share your personal information with third parties.
                </p>
                <p className="text-[var(--text-muted)] text-xs" style={{ marginTop: '8px' }}>
                  © {new Date().getFullYear()} College Orbit. All rights reserved.
                </p>
              </div>
            </div>
          </Card>
            </>
          )}
        </div>
      </div>

      {/* Email confirmation modal */}
      {showEmailConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs, 8px)',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
              Open Email App?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
              This will open your default email app to send a message to:
            </p>
            <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
              collegeorbit@protonmail.com
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEmailConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--panel-2)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('collegeorbit@protonmail.com');
                  setShowEmailConfirm(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--panel-2)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Copy Email
              </button>
              <button
                onClick={() => {
                  window.location.href = 'mailto:collegeorbit@protonmail.com';
                  setShowEmailConfirm(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-xs, 6px)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Open Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCanvasDisconnectModal}
        title="Disconnect from Canvas?"
        message="Your synced courses, assignments, and events will remain in College Orbit, but you won't receive any new updates from Canvas until you reconnect."
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleCanvasDisconnect}
        onCancel={() => setShowCanvasDisconnectModal(false)}
      />

      {/* Blackboard Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBlackboardDisconnectModal}
        title="Disconnect from Blackboard?"
        message="Your synced courses, assignments, and events will remain in College Orbit, but you won't receive any new updates from Blackboard until you reconnect."
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleBlackboardDisconnect}
        onCancel={() => setShowBlackboardDisconnectModal(false)}
      />

      {/* Moodle Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showMoodleDisconnectModal}
        title="Disconnect from Moodle?"
        message="Your synced courses, assignments, and events will remain in College Orbit, but you won't receive any new updates from Moodle until you reconnect."
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleMoodleDisconnect}
        onCancel={() => setShowMoodleDisconnectModal(false)}
      />

      {/* Brightspace Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBrightspaceDisconnectModal}
        title="Disconnect from Brightspace?"
        message="Your synced courses, assignments, and events will remain in College Orbit, but you won't receive any new updates from Brightspace until you reconnect."
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleBrightspaceDisconnect}
        onCancel={() => setShowBrightspaceDisconnectModal(false)}
      />

      {/* Google Calendar Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showGoogleCalendarDisconnectModal}
        title="Disconnect from Google Calendar?"
        message="Your imported events will remain in College Orbit, but syncing will stop until you reconnect. Exported events will remain in Google Calendar."
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleGoogleCalendarDisconnect}
        onCancel={() => setShowGoogleCalendarDisconnectModal(false)}
      />
    </>
  );
}

