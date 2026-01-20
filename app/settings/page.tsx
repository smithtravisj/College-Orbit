'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getDefaultCustomColors, getCustomColorSetForTheme, CustomColors, CustomColorSet } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import ConfirmationModal from '@/components/ConfirmationModal';
import { showDeleteToast } from '@/components/ui/DeleteToast';
import { Monitor, HelpCircle, RefreshCw, Link2, Unlink, ChevronDown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DASHBOARD_CARDS, TOOLS_CARDS, CARD_LABELS, PAGES, DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import releases from '@/data/releases.json';

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

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { data: session, status: sessionStatus } = useSession();
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('dark');
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
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const dueSoonInputRef = useRef<HTMLInputElement>(null);

  // Visibility customization state
  const [activeCustomizationTab, setActiveCustomizationTab] = useState<'pages' | 'dashboard' | 'tools'>('pages');
  const [visiblePages, setVisiblePages] = useState<string[]>(DEFAULT_VISIBLE_PAGES);
  const [visibleDashboardCards, setVisibleDashboardCards] = useState<string[]>(DEFAULT_VISIBLE_DASHBOARD_CARDS);
  const [visibleToolsCards, setVisibleToolsCards] = useState<string[]>(DEFAULT_VISIBLE_TOOLS_CARDS);
  const [toolsCardsOrder, setToolsCardsOrder] = useState<string[]>(Object.values(TOOLS_CARDS));
  const [visiblePagesOrder, setVisiblePagesOrder] = useState<string[]>(Object.values(PAGES).filter(p => p !== 'Settings'));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [visibilityMessage, setVisibilityMessage] = useState('');
  const [isMacDesktop, setIsMacDesktop] = useState(false);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailAccountAlerts, setEmailAccountAlerts] = useState(true);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyAccountAlerts, setNotifyAccountAlerts] = useState(true);

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
  const accentColor = effectiveUseCustomTheme && effectiveCustomColors
    ? getCustomColorSetForTheme(effectiveCustomColors as CustomColors, settings.theme || 'dark').accent
    : colorPalette.accent;
  const glowIntensity = isPremium ? (settings.glowIntensity ?? 50) : 50;
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');
  const confirmBeforeDelete = settings.confirmBeforeDelete ?? true;

  // Check if running on Mac desktop browser
  useEffect(() => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setIsMacDesktop(isMac);
  }, []);

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

  useEffect(() => {
    // Only run once on mount to initialize local state from store
    if (mounted) return;

    // Store is already initialized globally by AppLoader
    setDueSoonDays(settings.dueSoonWindowDays);
    setUniversity(settings.university || null);
    setSelectedTheme(settings.theme || 'dark');
    // Use saved visible pages directly - don't merge with defaults
    // as that would add back pages the user explicitly hid
    // Migrate "Deadlines" to "Assignments"
    const savedVisiblePages = (settings.visiblePages || []).map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
    setVisiblePages(savedVisiblePages.length > 0 ? savedVisiblePages : DEFAULT_VISIBLE_PAGES);
    setVisibleDashboardCards(settings.visibleDashboardCards || DEFAULT_VISIBLE_DASHBOARD_CARDS);
    setVisibleToolsCards(settings.visibleToolsCards || DEFAULT_VISIBLE_TOOLS_CARDS);

    // Load tools cards order from settings
    if (settings.toolsCardsOrder) {
      const order = typeof settings.toolsCardsOrder === 'string'
        ? JSON.parse(settings.toolsCardsOrder)
        : settings.toolsCardsOrder;
      setToolsCardsOrder(order);
    } else {
      setToolsCardsOrder(Object.values(TOOLS_CARDS));
    }

    // Load pages order from settings
    if (settings.visiblePagesOrder) {
      const order = typeof settings.visiblePagesOrder === 'string'
        ? JSON.parse(settings.visiblePagesOrder)
        : settings.visiblePagesOrder;
      // Migrate "Deadlines" to "Assignments"
      const migratedOrder = order.map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
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
    setEmailAnnouncements(settings.emailAnnouncements !== false);
    setEmailAccountAlerts(settings.emailAccountAlerts !== false);

    // Load in-app notification preferences
    setNotifyAnnouncements(settings.notifyAnnouncements !== false);
    setNotifyAccountAlerts(settings.notifyAccountAlerts !== false);

    // Load visual effects sliders
    setLocalGradientIntensity(settings.gradientIntensity ?? 50);
    setLocalGlowIntensity(settings.glowIntensity ?? 50);

    setMounted(true);
  }, [settings, mounted]);

  // Update input value when state changes (but not if user is editing)
  useEffect(() => {
    if (dueSoonInputRef.current && document.activeElement !== dueSoonInputRef.current) {
      dueSoonInputRef.current.value = String(dueSoonDays);
    }
  }, [dueSoonDays]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
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
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
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
            Customize your experience.
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
                activeSettingsTab === tab.key ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
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
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
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
                      color: selectedTheme === 'light' ? '#000000' : 'white',
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
            <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px', marginBottom: '0px', color: '#856404', fontSize: '14px' }}>
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
                borderRadius: '8px',
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
                      borderRadius: '6px',
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
                borderRadius: '8px',
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
                      borderRadius: '6px',
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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

            {/* Show Canvas Badges */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Show Canvas Badges</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Display Canvas markers on synced courses and assignments
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showCanvasBadges: !(settings.showCanvasBadges ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
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
                    borderRadius: '12px',
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
                  {/* Tasks count toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p className="text-sm text-[var(--text)]" style={{ margin: 0 }}>Tasks</p>
                      <div className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <HelpCircle
                          size={14}
                          className="text-[var(--text-muted)] cursor-help peer hover:text-[var(--text)]"
                          style={{ transition: 'color 0.15s' }}
                        />
                        <div
                          className="invisible peer-hover:visible opacity-0 peer-hover:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none"
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--text)',
                            backgroundColor: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            transition: 'opacity 0.15s, visibility 0.15s',
                          }}
                        >
                          Shows count of overdue tasks
                        </div>
                      </div>
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

                  {/* Assignments count toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p className="text-sm text-[var(--text)]" style={{ margin: 0 }}>Assignments</p>
                      <div className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <HelpCircle
                          size={14}
                          className="text-[var(--text-muted)] cursor-help peer hover:text-[var(--text)]"
                          style={{ transition: 'color 0.15s' }}
                        />
                        <div
                          className="invisible peer-hover:visible opacity-0 peer-hover:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none"
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--text)',
                            backgroundColor: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            transition: 'opacity 0.15s, visibility 0.15s',
                          }}
                        >
                          Shows count of overdue assignments
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ showNavCountAssignments: !(settings.showNavCountAssignments ?? true) })}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: (settings.showNavCountAssignments ?? true) ? 'var(--accent)' : 'var(--panel-2)',
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
                          left: (settings.showNavCountAssignments ?? true) ? '18px' : '2px',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>

                  {/* Exams count toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p className="text-sm text-[var(--text)]" style={{ margin: 0 }}>Exams</p>
                      <div className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <HelpCircle
                          size={14}
                          className="text-[var(--text-muted)] cursor-help peer hover:text-[var(--text)]"
                          style={{ transition: 'color 0.15s' }}
                        />
                        <div
                          className="invisible peer-hover:visible opacity-0 peer-hover:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none"
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--text)',
                            backgroundColor: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            transition: 'opacity 0.15s, visibility 0.15s',
                          }}
                        >
                          Shows total number of exams
                        </div>
                      </div>
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
            {/* Group Tasks by Course */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Group Tasks by Course</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Auto-group tasks by course in list view
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ groupTasksByCourse: !(settings.groupTasksByCourse ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
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

            {/* Group Assignments by Course */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Group Assignments by Course</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Auto-group assignments by course in list view
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ groupAssignmentsByCourse: !(settings.groupAssignmentsByCourse ?? false) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: (settings.groupAssignmentsByCourse ?? false) ? 'var(--accent)' : 'var(--panel-2)',
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
                      left: (settings.groupAssignmentsByCourse ?? false) ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Due Soon Window */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Due Soon Window</p>
              <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                Show deadlines on dashboard within this many days
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  ref={dueSoonInputRef}
                  type="text"
                  inputMode="numeric"
                  defaultValue={dueSoonDays}
                  onKeyUp={(e) => {
                    const inputValue = e.currentTarget.value;
                    setDueSoonDays(inputValue);
                    const val = parseInt(inputValue);
                    if (!isNaN(val) && val >= 1 && val <= 30) {
                      updateSettings({ dueSoonWindowDays: val });
                    }
                  }}
                  style={{
                    width: '80px',
                    height: '40px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>days</span>
              </div>
            </div>
          </Card>

          {/* Behavior */}
          <Card title="Behavior">
            {/* Confirm Before Delete */}
            <div style={{ marginBottom: '20px' }}>
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
                    borderRadius: '12px',
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Enable Keyboard Shortcuts</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Toggle keyboard navigation and action shortcuts
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ enableKeyboardShortcuts: !(settings.enableKeyboardShortcuts ?? true) })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
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
          </Card>
          </>
          )}

          {/* Integrations Tab - Canvas LMS Integration */}
          {activeSettingsTab === 'integrations' && (
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
                    <div className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <HelpCircle
                        size={14}
                        className="text-[var(--text-muted)] cursor-help peer hover:text-[var(--text)]"
                        style={{ transition: 'color 0.15s' }}
                      />
                      <div
                        className="invisible peer-hover:visible opacity-0 peer-hover:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none"
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: 'var(--text)',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          whiteSpace: 'nowrap',
                          zIndex: 50,
                          transition: 'opacity 0.15s, visibility 0.15s',
                        }}
                      >
                        Your school's Canvas domain (e.g., school.instructure.com)
                      </div>
                    </div>
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
                      borderRadius: '6px',
                    }}
                    disabled={canvasConnecting}
                  />
                </div>

                {/* API Access Token */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>API Access Token</p>
                    <div className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <HelpCircle
                        size={14}
                        className="text-[var(--text-muted)] cursor-help peer hover:text-[var(--text)]"
                        style={{ transition: 'color 0.15s' }}
                      />
                      <div
                        className="invisible peer-hover:visible opacity-0 peer-hover:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none"
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: 'var(--text)',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          width: '260px',
                          whiteSpace: 'normal',
                          lineHeight: '1.4',
                          zIndex: 50,
                          transition: 'opacity 0.15s, visibility 0.15s',
                        }}
                      >
                        Generate in Canvas: Account → Settings → New Access Token. Never share this token.
                      </div>
                    </div>
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
                      borderRadius: '6px',
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
                  borderRadius: '8px',
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
                      borderRadius: '6px',
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
                        { key: 'assignments', label: 'Assignments', description: 'Syncs to Assignments page', value: canvasSyncAssignments },
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
                            borderRadius: '6px',
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
          )}

          {/* Appearance Tab */}
          {activeSettingsTab === 'appearance' && (
            <>
          {/* Appearance - Theme, University, Custom Theme + Visual Effects */}
          <Card title="Appearance">
            {/* Theme */}
            <div style={{ marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Theme</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
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
                      borderRadius: '6px',
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
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
                  borderRadius: '6px',
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
                      borderRadius: '6px',
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

            {!isPremium && !isLoadingSubscription && (
              <div style={{ marginBottom: '16px' }}>
                <UpgradePrompt feature="Custom themes and visual effects" />
              </div>
            )}

            {/* Custom Theme Toggle */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Color Theme</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: '8px',
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
                    borderRadius: '6px',
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
                    borderRadius: '6px',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                >
                  Custom Theme
                </button>
              </div>
            </div>

            {/* Color Pickers */}
            {isPremium && useCustomTheme && customColors && (() => {
              const currentThemeMode = selectedTheme === 'system'
                ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : selectedTheme;
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

            {/* Visual Effects */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', opacity: isPremium ? 1 : 0.5 }}>
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
              <div>
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Colorblind Mode</p>
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
                  borderRadius: '6px',
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
                <p className="text-xs" style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '6px', border: '1px solid var(--warning)' }}>
                  Custom Theme is enabled, so colorblind color adjustments won't apply. Patterns will still work if selected.
                </p>
              )}

              {/* Color Preview */}
              {settings.colorblindMode && !effectiveUseCustomTheme && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>Preview:</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span data-status="success" style={{ position: 'relative', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>Success</span>
                    <span data-status="warning" style={{ position: 'relative', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>Warning</span>
                    <span data-status="danger" style={{ position: 'relative', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>Danger</span>
                  </div>
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
                          borderRadius: '8px',
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
                { id: 'dashboard', label: 'Dashboard Cards' },
                ...(isMobile ? [] : [{ id: 'tools', label: 'Tools Cards' }]),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => isPremium && setActiveCustomizationTab(tab.id as 'pages' | 'dashboard' | 'tools')}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    activeCustomizationTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
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
                          borderRadius: '8px',
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

            {/* Dashboard Cards Customization */}
            {activeCustomizationTab === 'dashboard' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Choose which cards appear on the Dashboard
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.values(DASHBOARD_CARDS).map((cardId) => (
                    <label
                      key={cardId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleDashboardCards.includes(cardId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibleDashboardCards([...visibleDashboardCards, cardId]);
                          } else {
                            setVisibleDashboardCards(visibleDashboardCards.filter((c) => c !== cardId));
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--text)', fontSize: '14px' }}>
                        {CARD_LABELS[cardId] || cardId}
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisibleDashboardCards(DEFAULT_VISIBLE_DASHBOARD_CARDS);
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
                  Drag to reorder cards or uncheck to hide them from the Tools page
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingIndex === null || dragOverIndex === null) return;
                    if (draggingIndex !== dragOverIndex) {
                      const newOrder = [...toolsCardsOrder];
                      const [draggedItem] = newOrder.splice(draggingIndex, 1);
                      const insertIndex = draggingIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                      newOrder.splice(insertIndex, 0, draggedItem);
                      setToolsCardsOrder(newOrder);
                    }
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  {toolsCardsOrder.map((cardId, index) => {
                    const isDragging = draggingIndex === index;
                    // Calculate if this item should shift up or down
                    let translateY = 0;
                    if (draggingIndex !== null && dragOverIndex !== null && !isDragging) {
                      const itemHeight = 48;
                      if (draggingIndex < dragOverIndex) {
                        if (index > draggingIndex && index < dragOverIndex) {
                          translateY = -itemHeight;
                        }
                      } else if (draggingIndex > dragOverIndex) {
                        if (index >= dragOverIndex && index < draggingIndex) {
                          translateY = itemHeight;
                        }
                      }
                    }

                    return (
                      <div
                        key={cardId}
                        data-card-id={cardId}
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
                            const newOrder = [...toolsCardsOrder];
                            const [draggedItem] = newOrder.splice(draggedIndex, 1);
                            const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                            newOrder.splice(insertIndex, 0, draggedItem);
                            setToolsCardsOrder(newOrder);
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
                          borderRadius: '8px',
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
                          checked={visibleToolsCards.includes(cardId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleToolsCards([...visibleToolsCards, cardId]);
                            } else {
                              setVisibleToolsCards(visibleToolsCards.filter((c) => c !== cardId));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                          {CARD_LABELS[cardId] || cardId}
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
                    setVisibleToolsCards(DEFAULT_VISIBLE_TOOLS_CARDS);
                    setToolsCardsOrder(Object.values(TOOLS_CARDS));
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
                    visibleDashboardCards,
                    visibleToolsCards,
                    toolsCardsOrder,
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
          <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Notification Preferences">
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '20px' : '24px' }}>
              {/* Email Column */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>
                  Email
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
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
                </div>
              </div>

              {/* In-App Column */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>
                  In-App
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
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
                </div>
              </div>
            </div>
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
              <div>
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
                    borderRadius: '6px',
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
              <div>
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
                    borderRadius: '6px',
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
              {/* Onboarding Tour */}
              <div style={{ paddingBottom: '18px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Onboarding Tour
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Replay the interactive tutorial to learn about app features
                </p>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={async () => {
                    try {
                      // Update settings through store (updates both local state and database)
                      await updateSettings({ hasCompletedOnboarding: false });

                      // Redirect to dashboard to start the tutorial
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Failed to restart tutorial:', error);
                    }
                  }}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  Restart Tutorial
                </Button>
              </div>
              {/* Keyboard Shortcuts */}
              <div style={{ paddingTop: '18px', paddingBottom: '18px', borderTop: '1px solid var(--border)' }}>
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
                    borderRadius: '4px',
                    color: 'var(--text)',
                    marginLeft: '4px',
                    marginRight: '4px',
                  }}>?</kbd> anywhere to view all available shortcuts
                </p>
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
                  <p className="text-[var(--text-muted)]">v{releases.releases[0]?.version || '1.0.0'}</p>
                  <Link
                    href="/release-notes"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ marginTop: '4px', display: 'inline-block' }}
                  >
                    View Release Notes
                  </Link>
                </div>
                <p className="text-[var(--text-secondary)]">
                  A personal, privacy-first dashboard for students to manage courses, deadlines, and tasks.
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
            borderRadius: '8px',
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
                  borderRadius: '6px',
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
                  borderRadius: '6px',
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
                  color: 'white',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px',
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
    </>
  );
}
