'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Shield, ExternalLink, Plus, Trash2, GraduationCap } from 'lucide-react';

// ==================== Types ====================
interface AnalyticsData {
  summary: {
    totalUsers: number;
    newUsersLast30Days: number;
    activeUsersLast30Days: number;
    newUserActivationRate: number;
    uniqueSessions: number;
    totalPageViews: number;
    loginsLast30Days: number;
    pagesPerActiveUser: number;
    returnVisitorRate: number;
    mostPopularPage: { name: string; count: number } | null;
    avgLoginsPerActiveUser: number;
  };
  topPages: Array<{ name: string; count: number }>;
  pageViewTrends: Array<{
    date: string;
    pages: Array<{ page: string; count: number }>;
  }>;
  uniquePages: string[];
  universityDistribution: Array<{ university: string; count: number }>;
  subscriptionStats: {
    premiumMonthly: number;
    premiumYearly: number;
    lifetimePremium: number;
    trialUsers: number;
    freeUsers: number;
  };
  revenueStats: {
    mrr: number;
    activeSubscriptions: number;
    canceledLast30Days: number;
    churnRate: string;
  };
}

interface CollegeRequest {
  id: string;
  collegeName: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface IssueReport {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface FeatureRequest {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface College {
  id: string;
  fullName: string;
  acronym: string;
  darkAccent: string;
  darkLink: string;
  lightAccent: string;
  lightLink: string;
  quickLinks: Array<{ label: string; url: string }>;
  isActive: boolean;
}

interface QuickLinkInput {
  label: string;
  url: string;
}

// ==================== Color Palettes ====================
const darkModeColors = [
  '#CC4400', '#1E40AF', '#065F46', '#7F1D1D', '#451A03',
  '#4C1D95', '#991B1B', '#0D3B66', '#92400E', '#581C1C',
];

const lightModeColors = [
  '#FFB84D', '#7FD8F7', '#7FE2B0', '#FF7FA0', '#C4B5A0',
  '#C4A0E0', '#F4A460', '#5FE3D0', '#FFD580', '#FF9999',
];

function getPageColor(index: number, isDarkMode: boolean): string {
  const palette = isDarkMode ? darkModeColors : lightModeColors;
  return palette[index % palette.length];
}

// ==================== Main Component ====================
export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isPremium } = useSubscription();
  const settings = useAppStore((state) => state.settings);
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

  // Custom theme and visual effects only apply for premium users
  const useCustomTheme = isPremium ? settings.useCustomTheme : false;
  const customColors = isPremium ? settings.customColors : null;
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, settings.theme || 'dark').accent
    : colorPalette.accent;
  const glowIntensity = isPremium ? (settings.glowIntensity ?? 50) : 50;
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');

  // Main tab state - initialize from localStorage
  const [activeTab, setActiveTab] = useState<'analytics' | 'management' | 'addCollege' | 'beta'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminTab');
      if (saved && ['analytics', 'management', 'addCollege', 'beta'].includes(saved)) {
        return saved as 'analytics' | 'management' | 'addCollege' | 'beta';
      }
    }
    return 'management';
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adminTab', activeTab);
  }, [activeTab]);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Management state
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequest[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [adminTab, setAdminTab] = useState<'college' | 'issues' | 'features'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSubTab');
      if (saved && ['college', 'issues', 'features'].includes(saved)) {
        return saved as 'college' | 'issues' | 'features';
      }
    }
    return 'college';
  });

  // Save admin sub-tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adminSubTab', adminTab);
  }, [adminTab]);

  // Grant premium state
  const [grantPremiumInput, setGrantPremiumInput] = useState('');
  const [grantPremiumLoading, setGrantPremiumLoading] = useState(false);
  const [grantPremiumMessage, setGrantPremiumMessage] = useState('');
  const [grantSemesterInput, setGrantSemesterInput] = useState('');
  const [grantSemesterLoading, setGrantSemesterLoading] = useState(false);
  const [grantSemesterMessage, setGrantSemesterMessage] = useState('');

  // Grant admin state
  const [grantAdminInput, setGrantAdminInput] = useState('');
  const [grantAdminLoading, setGrantAdminLoading] = useState(false);
  const [grantAdminMessage, setGrantAdminMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; name: string | null }>>([]);

  // User lookup state
  const [userLookupInput, setUserLookupInput] = useState('');
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupError, setUserLookupError] = useState('');
  const [lookupUser, setLookupUser] = useState<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    lastLogin: string | null;
    isAdmin: boolean;
    subscriptionTier: string;
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
    subscriptionExpiresAt: string | null;
    trialEndsAt: string | null;
    lifetimePremium: boolean;
  } | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeAdminLoading, setRevokeAdminLoading] = useState(false);

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementTier, setAnnouncementTier] = useState<'all' | 'free' | 'trial' | 'premium' | 'lifetime' | 'admin' | 'specific'>('all');
  const [announcementDelivery, setAnnouncementDelivery] = useState<'both' | 'notification' | 'email'>('both');
  const [announcementSpecificEmails, setAnnouncementSpecificEmails] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState('');

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    targetUserId: string | null;
    targetEmail: string | null;
    details: Record<string, any> | null;
    createdAt: string;
  }>>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Add/Edit College state
  const [colleges, setColleges] = useState<College[]>([]);
  const [addCollegeLoading, setAddCollegeLoading] = useState(false);
  const [addCollegeMessage, setAddCollegeMessage] = useState('');
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeAcronym, setNewCollegeAcronym] = useState('');
  const [newCollegeDarkAccent, setNewCollegeDarkAccent] = useState('#002E5D');
  const [newCollegeDarkLink, setNewCollegeDarkLink] = useState('#6ab2ff');
  const [newCollegeLightAccent, setNewCollegeLightAccent] = useState('#6ab2ff');
  const [newCollegeLightLink, setNewCollegeLightLink] = useState('#0035a8');
  const [newCollegeQuickLinks, setNewCollegeQuickLinks] = useState<QuickLinkInput[]>([
    { label: '', url: '' },
  ]);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [showDeleteCollegeConfirm, setShowDeleteCollegeConfirm] = useState(false);
  const [deleteCollegeId, setDeleteCollegeId] = useState<string | null>(null);

  // Modals
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [showDeleteIssueConfirm, setShowDeleteIssueConfirm] = useState(false);
  const [deleteIssueId, setDeleteIssueId] = useState<string | null>(null);
  const [showDeleteFeatureConfirm, setShowDeleteFeatureConfirm] = useState(false);
  const [deleteFeatureId, setDeleteFeatureId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  // Beta Program state
  const [betaSubTab, setBetaSubTab] = useState<'users' | 'feedback' | 'versions'>('users');
  const [betaUsers, setBetaUsers] = useState<Array<{ id: string; email: string; name: string | null; createdAt: string; betaJoinedAt: string }>>([]);
  const [betaFeedbackList, setBetaFeedbackList] = useState<Array<{
    id: string;
    userId: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved';
    adminResponse: string | null;
    respondedAt: string | null;
    createdAt: string;
    user: { email: string; name: string | null };
  }>>([]);
  const [appVersions, setAppVersions] = useState<Array<{
    id: string;
    version: string;
    changes: string[];
    isBetaOnly: boolean;
    releasedAt: string;
  }>>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof betaFeedbackList[0] | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [betaResponseLoading, setBetaResponseLoading] = useState(false);

  const selectedTheme = settings.theme || 'dark';

  // ==================== Theme Detection ====================
  useEffect(() => {
    const checkTheme = () => {
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlBgColor = htmlStyle.backgroundColor;
      const bodyBgColor = bodyStyle.backgroundColor;
      let bgColor = htmlBgColor !== 'rgba(0, 0, 0, 0)' ? htmlBgColor : bodyBgColor;

      let isLightBg = false;
      const rgbMatch = bgColor.match(/rgb\((\d+),?\s*(\d+),?\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        isLightBg = r > 200 && g > 200 && b > 200;
      } else if (bgColor.includes('#FFF') || bgColor.includes('#fff') || bgColor.includes('#ffffff')) {
        isLightBg = true;
      }
      setIsDarkMode(!isLightBg);
    };

    checkTheme();
    window.addEventListener('load', checkTheme);
    window.addEventListener('focus', checkTheme);
    document.addEventListener('visibilitychange', checkTheme);
    const interval = setInterval(checkTheme, 500);

    return () => {
      window.removeEventListener('load', checkTheme);
      window.removeEventListener('focus', checkTheme);
      document.removeEventListener('visibilitychange', checkTheme);
      clearInterval(interval);
    };
  }, []);

  // ==================== Fetch Analytics ====================
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/data');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalytics(data);
        // Cache admin status for instant nav display
        localStorage.setItem('isAdmin', 'true');
      } catch (err) {
        setAnalyticsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAnalytics();
    }
  }, [session, router]);

  // ==================== Fetch Admin Data ====================
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAdminData = async () => {
      try {
        const collegeResponse = await fetch('/api/admin/college-requests').catch(() => null);
        const issuesResponse = await fetch('/api/admin/issue-reports').catch(() => null);
        const featuresResponse = await fetch('/api/admin/feature-requests').catch(() => null);

        if (!collegeResponse || !issuesResponse || !featuresResponse ||
            collegeResponse.status === 403 || issuesResponse.status === 403 || featuresResponse.status === 403) {
          router.push('/');
          return;
        }

        if (collegeResponse.ok) {
          const collegeData = await collegeResponse.json();
          if (collegeData.requests) {
            setCollegeRequests(collegeData.requests);
          }
        }

        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          if (issuesData.reports) {
            setIssueReports(issuesData.reports);
          }
        }

        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json();
          if (featuresData.requests) {
            setFeatureRequests(featuresData.requests);
          }
        }

        // Fetch admin users
        const adminsResponse = await fetch('/api/admin/list-admins').catch(() => null);
        if (adminsResponse?.ok) {
          const adminsData = await adminsResponse.json();
          if (adminsData.admins) {
            setAdminUsers(adminsData.admins);
          }
        }

        // Fetch audit logs
        const auditResponse = await fetch('/api/admin/audit-log?limit=20').catch(() => null);
        if (auditResponse?.ok) {
          const auditData = await auditResponse.json();
          if (auditData.logs) {
            setAuditLogs(auditData.logs);
          }
        }

        // Fetch colleges (with cache)
        // First load from cache for instant display
        try {
          const cached = localStorage.getItem('admin-colleges-cache');
          if (cached) {
            const { colleges: cachedColleges } = JSON.parse(cached);
            if (cachedColleges) {
              setColleges(cachedColleges);
            }
          }
        } catch (e) {
          // Ignore cache errors
        }
        // Then fetch fresh data
        const collegesResponse = await fetch('/api/admin/colleges').catch(() => null);
        if (collegesResponse?.ok) {
          const collegesData = await collegesResponse.json();
          if (collegesData.colleges) {
            setColleges(collegesData.colleges);
            // Update cache
            localStorage.setItem('admin-colleges-cache', JSON.stringify({
              colleges: collegesData.colleges,
              timestamp: Date.now(),
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
  }, [session, router]);

  // Fetch Beta Program data when tab is active
  useEffect(() => {
    if (activeTab !== 'beta' || !session?.user?.id) return;

    const fetchBetaData = async () => {
      try {
        // Fetch beta users
        const usersRes = await fetch('/api/admin/beta-users').catch(() => null);
        if (usersRes?.ok) {
          const data = await usersRes.json();
          setBetaUsers(data.betaUsers || []);
        }

        // Fetch beta feedback
        const feedbackRes = await fetch('/api/admin/beta-feedback').catch(() => null);
        if (feedbackRes?.ok) {
          const data = await feedbackRes.json();
          setBetaFeedbackList(data.feedback || []);
        }

        // Fetch app versions
        const versionsRes = await fetch('/api/admin/app-versions').catch(() => null);
        if (versionsRes?.ok) {
          const data = await versionsRes.json();
          setAppVersions(data.versions || []);
        }
      } catch (error) {
        console.error('Error fetching beta data:', error);
      }
    };

    fetchBetaData();
  }, [activeTab, session]);

  const refreshAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/list-admins');
      if (response.ok) {
        const data = await response.json();
        if (data.admins) {
          setAdminUsers(data.admins);
        }
      }
    } catch (error) {
      console.error('Error refreshing admin users:', error);
    }
  };

  const refreshAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const response = await fetch('/api/admin/audit-log?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          setAuditLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Error refreshing audit logs:', error);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      grant_premium: 'Granted Lifetime Premium',
      grant_semester: 'Granted Semester Pass',
      revoke_premium: 'Revoked Premium',
      grant_admin: 'Granted Admin Access',
      revoke_admin: 'Revoked Admin Access',
      send_announcement: 'Sent Announcement',
      approve_college_request: 'Approved College Request',
      reject_college_request: 'Rejected College Request',
      resolve_issue_report: 'Resolved Issue Report',
      reject_issue_report: 'Rejected Issue Report',
      implement_feature_request: 'Implemented Feature Request',
      reject_feature_request: 'Rejected Feature Request',
    };
    return labels[action] || action;
  };

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleRevokeAdminFromList = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/admin/revoke-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setAdminUsers(adminUsers.filter(u => u.id !== userId));
        setGrantAdminMessage(`Revoked admin from ${userEmail}`);
        setTimeout(() => setGrantAdminMessage(''), 3000);
      } else {
        const data = await response.json();
        setGrantAdminMessage(`Error: ${data.error}`);
        setTimeout(() => setGrantAdminMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error revoking admin:', error);
      setGrantAdminMessage('Error: Failed to revoke admin');
      setTimeout(() => setGrantAdminMessage(''), 3000);
    }
  };

  // ==================== College Handler Functions ====================
  const COLLEGES_CACHE_KEY = 'admin-colleges-cache';

  const fetchColleges = async (skipCache = false) => {
    // Load from cache first for instant display
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(COLLEGES_CACHE_KEY);
        if (cached) {
          const { colleges: cachedColleges, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setColleges(cachedColleges);
            // Still fetch fresh data in background
            fetchColleges(true);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load colleges from cache:', e);
      }
    }

    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        const collegesData = data.colleges || [];
        setColleges(collegesData);
        // Save to cache
        localStorage.setItem(COLLEGES_CACHE_KEY, JSON.stringify({
          colleges: collegesData,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  // Reset form to default state
  const resetCollegeForm = () => {
    setEditingCollegeId(null);
    setNewCollegeName('');
    setNewCollegeAcronym('');
    setNewCollegeDarkAccent('#002E5D');
    setNewCollegeDarkLink('#6ab2ff');
    setNewCollegeLightAccent('#6ab2ff');
    setNewCollegeLightLink('#0035a8');
    setNewCollegeQuickLinks([{ label: '', url: '' }]);
  };

  // Load a college into the form for editing
  const loadCollegeForEdit = (college: College) => {
    setEditingCollegeId(college.id);
    setNewCollegeName(college.fullName);
    setNewCollegeAcronym(college.acronym);
    setNewCollegeDarkAccent(college.darkAccent);
    setNewCollegeDarkLink(college.darkLink);
    setNewCollegeLightAccent(college.lightAccent);
    setNewCollegeLightLink(college.lightLink);
    setNewCollegeQuickLinks(
      college.quickLinks.length > 0
        ? college.quickLinks.map(ql => ({ label: ql.label, url: ql.url }))
        : [{ label: '', url: '' }]
    );
  };

  const handleAddOrUpdateCollege = async () => {
    if (!newCollegeName.trim() || !newCollegeAcronym.trim()) {
      setAddCollegeMessage('Error: Name and acronym are required');
      setTimeout(() => setAddCollegeMessage(''), 3000);
      return;
    }

    setAddCollegeLoading(true);
    setAddCollegeMessage('');

    try {
      // Filter out empty quick links
      const validQuickLinks = newCollegeQuickLinks.filter(
        link => link.label.trim() && link.url.trim()
      );

      const isEditing = !!editingCollegeId;
      const response = await fetch('/api/admin/colleges', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing && { id: editingCollegeId }),
          fullName: newCollegeName.trim(),
          acronym: newCollegeAcronym.trim(),
          darkAccent: newCollegeDarkAccent,
          darkLink: newCollegeDarkLink,
          lightAccent: newCollegeLightAccent,
          lightLink: newCollegeLightLink,
          quickLinks: validQuickLinks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddCollegeMessage(isEditing ? 'College updated successfully!' : 'College added successfully!');
        // Reset form
        resetCollegeForm();
        // Refresh colleges list
        fetchColleges();
        setTimeout(() => setAddCollegeMessage(''), 3000);
      } else {
        setAddCollegeMessage(`Error: ${data.error}`);
        setTimeout(() => setAddCollegeMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error saving college:', error);
      setAddCollegeMessage('Error: Failed to save college');
      setTimeout(() => setAddCollegeMessage(''), 3000);
    } finally {
      setAddCollegeLoading(false);
    }
  };

  // Toggle college active status
  const handleToggleCollegeActive = async (college: College) => {
    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: college.id,
          isActive: !college.isActive,
        }),
      });

      if (response.ok) {
        const updatedColleges = colleges.map(c =>
          c.id === college.id ? { ...c, isActive: !c.isActive } : c
        );
        setColleges(updatedColleges);
        // Update cache
        localStorage.setItem(COLLEGES_CACHE_KEY, JSON.stringify({
          colleges: updatedColleges,
          timestamp: Date.now(),
        }));
      } else {
        alert('Failed to update college status');
      }
    } catch (error) {
      console.error('Error updating college:', error);
      alert('Failed to update college status');
    }
  };

  // Confirm delete college
  const confirmDeleteCollege = (collegeId: string) => {
    setDeleteCollegeId(collegeId);
    setShowDeleteCollegeConfirm(true);
  };

  const handleDeleteCollege = async () => {
    if (!deleteCollegeId) return;

    try {
      const response = await fetch(`/api/admin/colleges?id=${deleteCollegeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedColleges = colleges.filter(c => c.id !== deleteCollegeId);
        setColleges(updatedColleges);
        // Update cache
        localStorage.setItem(COLLEGES_CACHE_KEY, JSON.stringify({
          colleges: updatedColleges,
          timestamp: Date.now(),
        }));
        // If we were editing this college, reset the form
        if (editingCollegeId === deleteCollegeId) {
          resetCollegeForm();
        }
      } else {
        alert('Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert('Failed to delete college');
    } finally {
      setShowDeleteCollegeConfirm(false);
      setDeleteCollegeId(null);
    }
  };

  const addQuickLinkField = () => {
    setNewCollegeQuickLinks([...newCollegeQuickLinks, { label: '', url: '' }]);
  };

  const removeQuickLinkField = (index: number) => {
    setNewCollegeQuickLinks(newCollegeQuickLinks.filter((_, i) => i !== index));
  };

  const updateQuickLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...newCollegeQuickLinks];
    updated[index][field] = value;
    setNewCollegeQuickLinks(updated);
  };

  // ==================== Handler Functions ====================
  const handleMarkAsAdded = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/college-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'added' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this request. Please try again.');
        return;
      }

      setCollegeRequests(collegeRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error marking as added:', error);
      alert('We couldn\'t update this request. Please try again.');
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    setDeleteRequestId(requestId);
    setShowDeleteRequestConfirm(true);
  };

  const confirmDeleteRequest = async () => {
    if (!deleteRequestId) return;

    try {
      const response = await fetch('/api/admin/college-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: deleteRequestId, status: 'rejected' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this request. Please try again.');
        setShowDeleteRequestConfirm(false);
        return;
      }

      setCollegeRequests(collegeRequests.filter(req => req.id !== deleteRequestId));
      setShowDeleteRequestConfirm(false);
      setDeleteRequestId(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('We couldn\'t update this request. Please try again.');
      setShowDeleteRequestConfirm(false);
    }
  };

  const handleMarkIssueFixed = async (reportId: string) => {
    try {
      const response = await fetch('/api/admin/issue-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status: 'fixed' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this issue. Please try again.');
        return;
      }

      setIssueReports(issueReports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error marking as fixed:', error);
      alert('We couldn\'t update this issue. Please try again.');
    }
  };

  const handleDeleteIssue = (reportId: string) => {
    setDeleteIssueId(reportId);
    setShowDeleteIssueConfirm(true);
  };

  const confirmDeleteIssue = async () => {
    if (!deleteIssueId) return;

    try {
      const response = await fetch('/api/admin/issue-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: deleteIssueId, status: 'rejected' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this issue. Please try again.');
        setShowDeleteIssueConfirm(false);
        return;
      }

      setIssueReports(issueReports.filter(report => report.id !== deleteIssueId));
      setShowDeleteIssueConfirm(false);
      setDeleteIssueId(null);
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('We couldn\'t update this issue. Please try again.');
      setShowDeleteIssueConfirm(false);
    }
  };

  const handleMarkFeatureImplemented = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/feature-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'implemented' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this feature request. Please try again.');
        return;
      }

      setFeatureRequests(featureRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error marking as implemented:', error);
      alert('We couldn\'t update this feature request. Please try again.');
    }
  };

  const handleDeleteFeature = (requestId: string) => {
    setDeleteFeatureId(requestId);
    setShowDeleteFeatureConfirm(true);
  };

  const confirmDeleteFeature = async () => {
    if (!deleteFeatureId) return;

    try {
      const response = await fetch('/api/admin/feature-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: deleteFeatureId, status: 'rejected' }),
      });

      if (!response.ok) {
        alert('We couldn\'t update this feature request. Please try again.');
        setShowDeleteFeatureConfirm(false);
        return;
      }

      setFeatureRequests(featureRequests.filter(request => request.id !== deleteFeatureId));
      setShowDeleteFeatureConfirm(false);
      setDeleteFeatureId(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('We couldn\'t update this feature request. Please try again.');
      setShowDeleteFeatureConfirm(false);
    }
  };

  const handleGrantPremium = async () => {
    if (!grantPremiumInput.trim()) {
      setGrantPremiumMessage('Please enter a user ID or email');
      setTimeout(() => setGrantPremiumMessage(''), 3000);
      return;
    }

    setGrantPremiumLoading(true);
    setGrantPremiumMessage('');

    try {
      const response = await fetch('/api/admin/grant-lifetime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdOrEmail: grantPremiumInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGrantPremiumMessage(`Error: ${data.error}`);
        setGrantPremiumLoading(false);
        setTimeout(() => setGrantPremiumMessage(''), 5000);
        return;
      }

      setGrantPremiumMessage(`Success: ${data.message}`);
      setGrantPremiumInput('');
      setGrantPremiumLoading(false);
      setTimeout(() => setGrantPremiumMessage(''), 5000);
    } catch (error) {
      console.error('Error granting premium:', error);
      setGrantPremiumMessage('Error: Failed to grant premium');
      setGrantPremiumLoading(false);
      setTimeout(() => setGrantPremiumMessage(''), 3000);
    }
  };

  const handleGrantSemester = async () => {
    if (!grantSemesterInput.trim()) {
      setGrantSemesterMessage('Please enter a user ID or email');
      setTimeout(() => setGrantSemesterMessage(''), 3000);
      return;
    }

    setGrantSemesterLoading(true);
    setGrantSemesterMessage('');

    try {
      const response = await fetch('/api/admin/grant-semester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdOrEmail: grantSemesterInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGrantSemesterMessage(`Error: ${data.error}`);
        setGrantSemesterLoading(false);
        setTimeout(() => setGrantSemesterMessage(''), 5000);
        return;
      }

      setGrantSemesterMessage(`Success: ${data.message}`);
      setGrantSemesterInput('');
      setGrantSemesterLoading(false);
      setTimeout(() => setGrantSemesterMessage(''), 5000);
    } catch (error) {
      console.error('Error granting semester pass:', error);
      setGrantSemesterMessage('Error: Failed to grant semester pass');
      setGrantSemesterLoading(false);
      setTimeout(() => setGrantSemesterMessage(''), 3000);
    }
  };

  const handleGrantAdmin = async () => {
    if (!grantAdminInput.trim()) {
      setGrantAdminMessage('Please enter a user ID or email');
      setTimeout(() => setGrantAdminMessage(''), 3000);
      return;
    }

    setGrantAdminLoading(true);
    setGrantAdminMessage('');

    try {
      const response = await fetch('/api/admin/grant-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdOrEmail: grantAdminInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGrantAdminMessage(`Error: ${data.error}`);
        setGrantAdminLoading(false);
        setTimeout(() => setGrantAdminMessage(''), 5000);
        return;
      }

      setGrantAdminMessage(`Success: ${data.message}`);
      setGrantAdminInput('');
      setGrantAdminLoading(false);
      refreshAdminUsers();
      setTimeout(() => setGrantAdminMessage(''), 5000);
    } catch (error) {
      console.error('Error granting admin:', error);
      setGrantAdminMessage('Error: Failed to grant admin access');
      setGrantAdminLoading(false);
      setTimeout(() => setGrantAdminMessage(''), 3000);
    }
  };

  const handleUserLookup = async () => {
    if (!userLookupInput.trim()) {
      setUserLookupError('Please enter an email address');
      setTimeout(() => setUserLookupError(''), 3000);
      return;
    }

    setUserLookupLoading(true);
    setUserLookupError('');
    setLookupUser(null);

    try {
      const response = await fetch(`/api/admin/user-lookup?email=${encodeURIComponent(userLookupInput)}`);
      const data = await response.json();

      if (!response.ok) {
        setUserLookupError(data.error || 'User not found');
        setUserLookupLoading(false);
        return;
      }

      setLookupUser(data.user);
      setUserLookupLoading(false);
    } catch (error) {
      console.error('Error looking up user:', error);
      setUserLookupError('Failed to look up user');
      setUserLookupLoading(false);
    }
  };

  const handleRevokePremium = async () => {
    if (!lookupUser) return;

    setRevokeLoading(true);

    try {
      const response = await fetch('/api/admin/revoke-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: lookupUser.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUserLookupError(data.error || 'Failed to revoke premium');
        setRevokeLoading(false);
        setTimeout(() => setUserLookupError(''), 5000);
        return;
      }

      // Refresh user data
      setLookupUser({
        ...lookupUser,
        lifetimePremium: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'none',
        subscriptionPlan: null,
        subscriptionExpiresAt: null,
      });
      setRevokeLoading(false);
    } catch (error) {
      console.error('Error revoking premium:', error);
      setUserLookupError('Failed to revoke premium');
      setRevokeLoading(false);
      setTimeout(() => setUserLookupError(''), 3000);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!lookupUser) return;

    setRevokeAdminLoading(true);

    try {
      const response = await fetch('/api/admin/revoke-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: lookupUser.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUserLookupError(data.error || 'Failed to revoke admin');
        setRevokeAdminLoading(false);
        setTimeout(() => setUserLookupError(''), 5000);
        return;
      }

      // Refresh user data
      setLookupUser({
        ...lookupUser,
        isAdmin: false,
      });
      setRevokeAdminLoading(false);
    } catch (error) {
      console.error('Error revoking admin:', error);
      setUserLookupError('Failed to revoke admin');
      setRevokeAdminLoading(false);
      setTimeout(() => setUserLookupError(''), 3000);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementResult('Error: Title and message are required');
      setTimeout(() => setAnnouncementResult(''), 3000);
      return;
    }

    if (announcementTier === 'specific' && !announcementSpecificEmails.trim()) {
      setAnnouncementResult('Error: Please enter at least one email address');
      setTimeout(() => setAnnouncementResult(''), 3000);
      return;
    }

    setAnnouncementLoading(true);
    setAnnouncementResult('');

    try {
      const response = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMessage,
          tierFilter: announcementTier === 'specific' ? 'specific' : announcementTier,
          deliveryMethod: announcementDelivery,
          specificEmails: announcementTier === 'specific'
            ? announcementSpecificEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e)
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnnouncementResult(`Error: ${data.error}`);
        setAnnouncementLoading(false);
        setTimeout(() => setAnnouncementResult(''), 5000);
        return;
      }

      // Build result message based on delivery method
      let resultParts: string[] = [];
      if (announcementDelivery !== 'email') {
        resultParts.push(`${data.notificationsSent || data.recipientCount} notifications`);
      }
      if (announcementDelivery !== 'notification') {
        let emailInfo = `${data.emailsSent} emails sent`;
        if (data.emailsOptedOut > 0) {
          emailInfo += `, ${data.emailsOptedOut} opted out`;
        }
        if (data.emailsFailed > 0) {
          emailInfo += `, ${data.emailsFailed} failed`;
          if (data.emailErrors?.length > 0) {
            emailInfo += `: ${data.emailErrors[0]}`;
          }
        }
        resultParts.push(emailInfo);
      }
      setAnnouncementResult(`Success: ${data.message} (${resultParts.join('; ')})`);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementSpecificEmails('');
      setAnnouncementLoading(false);
      setTimeout(() => setAnnouncementResult(''), 5000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      setAnnouncementResult('Error: Failed to send announcement');
      setAnnouncementLoading(false);
      setTimeout(() => setAnnouncementResult(''), 3000);
    }
  };

  // ==================== Render ====================
  return (
    <>
      {/* Admin Header */}
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
            Admin
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Manage your application.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '0 20px' : '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'management', label: 'Management' },
            { id: 'addCollege', label: 'Add College' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'beta', label: 'Beta' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'analytics' | 'management' | 'addCollege' | 'beta')}
              className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                activeTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                backgroundImage: activeTab === tab.id
                  ? (settings.theme === 'light'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                    : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)')
                  : 'none',
                boxShadow: activeTab === tab.id ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (analyticsLoading ? (
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0' }}>
          <div className="flex items-center justify-center" style={{ height: '200px' }}>
            <div className="text-[var(--text-muted)]">Loading analytics...</div>
          </div>
        </div>
      ) : analyticsError ? (
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0' }}>
          <div className="flex items-center justify-center" style={{ height: '200px' }}>
            <div className="text-[var(--text-muted)]">Error: {analyticsError}</div>
          </div>
        </div>
      ) : analytics && (
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          <div className="w-full" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 'var(--grid-gap)' }}>
            {/* Summary Stats */}
            <Card title="Summary">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Users</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.totalUsers}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>New Users (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.newUsersLast30Days}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Active Users (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.activeUsersLast30Days}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Unique Sessions</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.uniqueSessions}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Logins (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.loginsLast30Days}
                  </p>
                </div>
              </div>
            </Card>

            {/* Activity Stats */}
            <Card title="Engagement">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Page Views</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.totalPageViews}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Avg Views/Session</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.uniqueSessions > 0
                      ? (analytics.summary.totalPageViews / analytics.summary.uniqueSessions).toFixed(1)
                      : 0}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Pages/Active User</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.summary.pagesPerActiveUser}
                  </p>
                </div>
              </div>
            </Card>

            {/* Subscription Stats */}
            <Card title="Subscriptions">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Premium (Monthly)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.subscriptionStats.premiumMonthly}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Premium (Yearly)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.subscriptionStats.premiumYearly}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Lifetime Premium</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.subscriptionStats.lifetimePremium}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Trial Users</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.subscriptionStats.trialUsers}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Free Users</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.subscriptionStats.freeUsers}
                  </p>
                </div>
              </div>
            </Card>

            {/* Revenue Stats */}
            <Card title="Revenue">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Monthly Recurring Revenue</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    ${analytics.revenueStats.mrr.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Active Subscriptions</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.revenueStats.activeSubscriptions}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Canceled (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.revenueStats.canceledLast30Days}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Churn Rate (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {analytics.revenueStats.churnRate}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Pages */}
          <div style={{ marginTop: 'var(--grid-gap)' }}>
            <Card title="Most Visited Pages">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Pages ranked by total visits. Shows which features your users visit most frequently.
                </p>
              </div>
              {analytics.topPages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No page views yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.topPages.map((page, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0 }}>{page.name}</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                        {page.count} visits
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Page View Trends */}
          <div style={{ marginTop: 'var(--grid-gap)' }}>
            <Card title="Daily Page Views (Last 7 Days)">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Hover over sections to see page details.
                </p>
              </div>
              {analytics.pageViewTrends.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No page views yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  {analytics.pageViewTrends.map((trend, index) => {
                    const dayTotal = trend.pages.reduce((sum, p) => sum + p.count, 0);

                    return (
                      <div key={index}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '90px', fontWeight: '500' }}>
                            {trend.date}
                          </p>
                          <div
                            style={{
                              flex: 1,
                              height: '40px',
                              backgroundColor: 'var(--panel-2)',
                              borderRadius: '4px',
                              overflow: 'visible',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              position: 'relative',
                              minHeight: 'auto',
                            }}
                          >
                            {[...analytics.uniquePages]
                            .sort()
                            .map((page) => trend.pages.find((p) => p.page === page))
                            .filter((page) => page !== undefined)
                            .map((pageData) => {
                              if (!pageData) return null;
                              const pagePercentage =
                                dayTotal > 0
                                  ? (pageData.count / dayTotal) * 100
                                  : 0;
                              const isHovered = hoveredSegment === `${trend.date}-${pageData.page}`;

                              return (
                                <div
                                  key={pageData.page}
                                  onMouseEnter={() => setHoveredSegment(`${trend.date}-${pageData.page}`)}
                                  onMouseLeave={() => setHoveredSegment(null)}
                                  style={{
                                    height: '100%',
                                    width: `${Math.max(0, pagePercentage)}%`,
                                    backgroundColor: getPageColor(analytics.uniquePages.indexOf(pageData.page), isDarkMode),
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: pagePercentage > 0 ? '4px' : '0',
                                    transform: isHovered ? 'scaleY(1.3)' : 'scaleY(1)',
                                    position: 'relative',
                                    zIndex: isHovered ? 10 : 1,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isHovered && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 8px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: 'var(--panel)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        padding: '12px 20px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        lineHeight: '1',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                        zIndex: 100,
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        textTransform: 'capitalize',
                                      }}
                                    >
                                      {pageData.page}: {pageData.count}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)', minWidth: '35px', textAlign: 'right' }}>
                            {dayTotal}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* University Distribution */}
          <div style={{ marginTop: 'var(--grid-gap)' }}>
            <Card title="Users by University">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Number of users with each university selected in their settings.
                </p>
              </div>
              {analytics.universityDistribution.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No university data yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.universityDistribution.map((item, index) => {
                    const uniColorPalette = getCollegeColorPalette(item.university, isDarkMode ? 'dark' : 'light');
                    const uniAccentColor = uniColorPalette.accent;

                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: uniAccentColor,
                            flexShrink: 0,
                          }}
                        />
                        <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0, flex: 1 }}>
                          {item.university}
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                          {item.count} {item.count === 1 ? 'user' : 'users'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Info Message */}
          <div
            style={{
              marginTop: 'var(--grid-gap)',
              padding: '16px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: 0, marginBottom: '12px', fontWeight: '500', color: 'var(--text)' }}>How This Works</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Anonymous Session IDs:</strong> Each visitor gets a unique session ID (not tied to their user account) that resets every 30 minutes
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>No Personal Data:</strong> Only page visits and interactions are tracked, no personally identifiable information is stored
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Aggregated Stats:</strong> All numbers shown are totals and rankings, never individual user data
              </li>
              <li>
                <strong>Admin Only:</strong> This dashboard is only visible to administrators and shows high-level insights
              </li>
            </ul>
          </div>
        </div>
      ))}

      {/* Management Tab Content */}
      {activeTab === 'management' && (
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          {/* External Services Card - Full Width */}
          <div style={{ marginBottom: isMobile ? '8px' : '24px' }}>
            <Card title="External Services">
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              <a
                href="https://dashboard.stripe.com/acct_1Sr2ZaPr50btBHL1/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: '1 1 150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Stripe</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Payments</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://resend.com/emails"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Resend</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Emails</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://railway.com/project/80ee06d5-3310-4fe7-92a4-7d463d879ed8?environmentId=14f6127e-9353-4f22-b387-bb9f0b125874"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Railway</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hosting</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://github.com/smithtravisj/College-Orbit"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>GitHub</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://college-orbit.sentry.io/issues/errors-outages/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Sentry</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Errors</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://search.google.com/u/1/search-console?resource_id=https%3A%2F%2Fcollegeorbit.app%2F"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Search Console</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SEO</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://dash.cloudflare.com/2e0698a162c8bc67e145f78a9587ca30/collegeorbit.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Cloudflare</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DNS & Security</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://websitelaunches.com/site-health/seo.php?domain=collegeorbit.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Site Health</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SEO Audit</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>

              <a
                href="https://chrome.google.com/u/1/webstore/devconsole/23a42bdf-0504-4cdf-a3e0-1f7a3699c126"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Chrome Store</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Extension</div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
              </a>
              </div>
            </Card>
          </div>

          <div className="w-full" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--grid-gap)' }}>
            {/* Admin Requests Card */}
            <Card title="Requests">
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { id: 'college', label: 'College Requests' },
                  { id: 'issues', label: 'Issue Reports' },
                  { id: 'features', label: 'Feature Requests' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as 'college' | 'issues' | 'features')}
                    className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                      adminTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                    style={{
                      padding: '8px 14px',
                      fontSize: '14px',
                      border: 'none',
                      backgroundColor: adminTab === tab.id ? 'var(--nav-active)' : 'transparent',
                      backgroundImage: adminTab === tab.id ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                      boxShadow: adminTab === tab.id ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* College Requests Tab */}
              {adminTab === 'college' && (
                <>
                  {collegeRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No pending college requests</p>
                  ) : (
                    <div className="space-y-6">
                    {collegeRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                            {request.collegeName}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Requested by {request.user.name || request.user.email} - Status: {request.status}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {request.status !== 'added' && (
                            <button
                              onClick={() => handleMarkAsAdded(request.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '14px',
                                backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
                                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                                color: selectedTheme === 'light' ? '#000000' : 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                              }}
                            >
                              Mark Added
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </>
              )}

              {/* Issue Reports Tab */}
              {adminTab === 'issues' && (
                <>
                  {issueReports.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No pending issue reports</p>
                  ) : (
                    <div className="space-y-6">
                    {issueReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => {
                          setSelectedIssue(report);
                          setShowIssueModal(true);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel-3)';
                          e.currentTarget.style.borderColor = 'var(--text-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px', wordBreak: 'break-word' }}>
                            {report.description.length > 80 ? report.description.substring(0, 80) + '...' : report.description}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Reported by {report.user.name || report.user.email} - Status: {report.status}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkIssueFixed(report.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Mark Fixed
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteIssue(report.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </>
              )}

              {/* Feature Requests Tab */}
              {adminTab === 'features' && (
                <>
                  {featureRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No pending feature requests</p>
                  ) : (
                    <div className="space-y-6">
                    {featureRequests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => {
                          setSelectedFeature(request);
                          setShowFeatureModal(true);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '12px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel-3)';
                          e.currentTarget.style.borderColor = 'var(--text-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px', wordBreak: 'break-word' }}>
                            {request.description.length > 80 ? request.description.substring(0, 80) + '...' : request.description}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Requested by {request.user.name || request.user.email} - Status: {request.status}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkFeatureImplemented(request.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Mark Implemented
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFeature(request.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Grant Premium Access Card */}
            <Card title="Grant Premium Access">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Lifetime Premium Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>Lifetime Premium</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                      Permanent premium access — never expires.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                    {!isMobile && <Crown size={20} style={{ color: selectedTheme === 'light' ? '#000000' : 'white', flexShrink: 0 }} />}
                    <input
                      type="text"
                      value={grantPremiumInput}
                      onChange={(e) => setGrantPremiumInput(e.target.value)}
                      placeholder="User ID or email"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGrantPremium();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        fontSize: '14px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleGrantPremium}
                      disabled={grantPremiumLoading}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: accentColor,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                        color: selectedTheme === 'light' ? '#000000' : 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: grantPremiumLoading ? 'not-allowed' : 'pointer',
                        opacity: grantPremiumLoading ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                      }}
                    >
                      {grantPremiumLoading ? 'Granting...' : 'Grant Lifetime'}
                    </button>
                  </div>
                  {grantPremiumMessage && (
                    <p style={{
                      fontSize: '14px',
                      color: grantPremiumMessage.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                      margin: 0,
                    }}>
                      {grantPremiumMessage}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)' }} />

                {/* Semester Pass Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>Semester Pass</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                      4 months of premium access — great for a semester.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                    {!isMobile && <Crown size={20} style={{ color: selectedTheme === 'light' ? '#000000' : 'white', flexShrink: 0 }} />}
                    <input
                      type="text"
                      value={grantSemesterInput}
                      onChange={(e) => setGrantSemesterInput(e.target.value)}
                      placeholder="User ID or email"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGrantSemester();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        fontSize: '14px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleGrantSemester}
                      disabled={grantSemesterLoading}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: accentColor,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                        color: selectedTheme === 'light' ? '#000000' : 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: grantSemesterLoading ? 'not-allowed' : 'pointer',
                        opacity: grantSemesterLoading ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                      }}
                    >
                      {grantSemesterLoading ? 'Granting...' : 'Grant Semester'}
                    </button>
                  </div>
                  {grantSemesterMessage && (
                    <p style={{
                      fontSize: '14px',
                      color: grantSemesterMessage.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                      margin: 0,
                    }}>
                      {grantSemesterMessage}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Grant Admin Card */}
            <Card title="Grant Admin Access">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Grant a user admin access. They will receive a notification and have access to the Admin panel. Admins automatically receive lifetime premium.
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                  {!isMobile && <Shield size={24} style={{ color: selectedTheme === 'light' ? '#000000' : 'white', flexShrink: 0 }} />}
                  <input
                    type="text"
                    value={grantAdminInput}
                    onChange={(e) => setGrantAdminInput(e.target.value)}
                    placeholder="User ID or email"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleGrantAdmin();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleGrantAdmin}
                    disabled={grantAdminLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: accentColor,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: selectedTheme === 'light' ? '#000000' : 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: grantAdminLoading ? 'not-allowed' : 'pointer',
                      opacity: grantAdminLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                    }}
                  >
                    {grantAdminLoading ? 'Granting...' : 'Grant Admin'}
                  </button>
                </div>
                {grantAdminMessage && (
                  <p style={{
                    fontSize: '14px',
                    color: grantAdminMessage.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                    margin: 0,
                  }}>
                    {grantAdminMessage}
                  </p>
                )}
                {adminUsers.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Current Admins ({adminUsers.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {adminUsers.map((admin) => (
                        <div
                          key={admin.id}
                          style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'stretch' : 'center',
                            gap: isMobile ? '8px' : '12px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {admin.name || admin.email}
                            </p>
                            {admin.name && (
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {admin.email}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRevokeAdminFromList(admin.id, admin.email)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                              color: selectedTheme === 'light' ? '#000000' : 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 0 10px rgba(220, 38, 38, 0.3)',
                              flexShrink: 0,
                              alignSelf: isMobile ? 'flex-start' : 'center',
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* User Lookup Card */}
            <Card title="User Lookup">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Search for a user by email to view their subscription status and manage their account.
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                  <input
                    type="email"
                    value={userLookupInput}
                    onChange={(e) => setUserLookupInput(e.target.value)}
                    placeholder="user@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUserLookup();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleUserLookup}
                    disabled={userLookupLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: accentColor,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: selectedTheme === 'light' ? '#000000' : 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: userLookupLoading ? 'not-allowed' : 'pointer',
                      opacity: userLookupLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                    }}
                  >
                    {userLookupLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {userLookupError && (
                  <p style={{ fontSize: '14px', color: 'var(--danger)', margin: 0 }}>
                    {userLookupError}
                  </p>
                )}
                {lookupUser && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Email</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>{lookupUser.email}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Name</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>{lookupUser.name || 'Not set'}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Signed Up</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                          {new Date(lookupUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Last Login</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                          {lookupUser.lastLogin ? new Date(lookupUser.lastLogin).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Subscription</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                          {lookupUser.lifetimePremium ? 'Lifetime Premium' :
                           lookupUser.subscriptionTier === 'premium' ? `Premium (${lookupUser.subscriptionPlan || 'unknown'})` :
                           lookupUser.subscriptionTier === 'trial' ? 'Trial' : 'Free'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Status</p>
                        <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                          {lookupUser.isAdmin ? 'Admin' : 'User'}
                        </p>
                      </div>
                      {lookupUser.trialEndsAt && lookupUser.subscriptionTier === 'trial' && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Trial Ends</p>
                          <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                            {new Date(lookupUser.trialEndsAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {lookupUser.subscriptionExpiresAt && lookupUser.subscriptionTier === 'premium' && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Subscription Expires</p>
                          <p style={{ color: 'var(--text)', margin: 0, fontWeight: '500' }}>
                            {new Date(lookupUser.subscriptionExpiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {(lookupUser.lifetimePremium || lookupUser.subscriptionTier === 'premium') && (
                        <button
                          onClick={handleRevokePremium}
                          disabled={revokeLoading}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                            color: selectedTheme === 'light' ? '#000000' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: revokeLoading ? 'not-allowed' : 'pointer',
                            opacity: revokeLoading ? 0.6 : 1,
                            boxShadow: '0 0 10px rgba(220, 38, 38, 0.3)',
                          }}
                        >
                          {revokeLoading ? 'Revoking...' : 'Revoke Premium'}
                        </button>
                      )}
                      {lookupUser.isAdmin && (
                        <button
                          onClick={handleRevokeAdmin}
                          disabled={revokeAdminLoading}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                            color: selectedTheme === 'light' ? '#000000' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: revokeAdminLoading ? 'not-allowed' : 'pointer',
                            opacity: revokeAdminLoading ? 0.6 : 1,
                            boxShadow: '0 0 10px rgba(220, 38, 38, 0.3)',
                          }}
                        >
                          {revokeAdminLoading ? 'Revoking...' : 'Revoke Admin'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Announcements Card */}
            <Card title="Announcements">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Send notifications and/or emails to users.
                </p>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                  style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    backgroundColor: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Announcement message..."
                  rows={4}
                  style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    backgroundColor: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Deliver via:</label>
                  <select
                    value={announcementDelivery}
                    onChange={(e) => setAnnouncementDelivery(e.target.value as 'both' | 'notification' | 'email')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      paddingRight: '36px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px',
                    }}
                  >
                    <option value="both">Both</option>
                    <option value="notification">Notification Only</option>
                    <option value="email">Email Only</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Send to:</label>
                  <select
                    value={announcementTier}
                    onChange={(e) => setAnnouncementTier(e.target.value as 'all' | 'free' | 'trial' | 'premium' | 'lifetime' | 'admin' | 'specific')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      paddingRight: '36px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px',
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="trial">Trial Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="lifetime">Lifetime Premium</option>
                    <option value="admin">Admins</option>
                    <option value="specific">Specific Users</option>
                  </select>
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={announcementLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: accentColor,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: selectedTheme === 'light' ? '#000000' : 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: announcementLoading ? 'not-allowed' : 'pointer',
                      opacity: announcementLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                    }}
                  >
                    {announcementLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {announcementTier === 'specific' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Enter email addresses (comma or newline separated):
                    </label>
                    <textarea
                      value={announcementSpecificEmails}
                      onChange={(e) => setAnnouncementSpecificEmails(e.target.value)}
                      placeholder="user1@example.com, user2@example.com"
                      rows={3}
                      style={{
                        padding: '10px 14px',
                        fontSize: '14px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '60px',
                      }}
                    />
                  </div>
                )}
                {announcementResult && (
                  <p style={{
                    fontSize: '14px',
                    color: announcementResult.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                    margin: 0,
                  }}>
                    {announcementResult}
                  </p>
                )}
              </div>
            </Card>

            {/* Audit Log Card */}
            <Card title="Audit Log">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Recent admin actions (last 20)
                  </p>
                  <button
                    onClick={refreshAuditLogs}
                    disabled={auditLogsLoading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: auditLogsLoading ? 'not-allowed' : 'pointer',
                      opacity: auditLogsLoading ? 0.6 : 1,
                    }}
                  >
                    {auditLogsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {auditLogs.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No audit logs yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                            {getActionLabel(log.action)}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                            {getTimeAgo(log.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>by {log.adminEmail}</span>
                          {log.targetEmail && (
                            <span> → {log.targetEmail}</span>
                          )}
                        </div>
                        {log.details && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.8 }}>
                            {log.details.title && <span>Title: {log.details.title}</span>}
                            {log.details.collegeName && <span>College: {log.details.collegeName}</span>}
                            {log.details.recipientCount && <span>Recipients: {log.details.recipientCount}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* Add College Tab Content */}
      {activeTab === 'addCollege' && (
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--grid-gap)' }}>
            {/* Form Section */}
            <Card title={editingCollegeId ? 'Edit College' : 'Add New College'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Editing indicator with clear button */}
                {editingCollegeId && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Editing: <span style={{ color: 'var(--text)', fontWeight: '500' }}>{newCollegeName || 'College'}</span>
                    </span>
                    <button
                      onClick={resetCollegeForm}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 'var(--panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      New College
                    </button>
                  </div>
                )}

                {/* College Name and Acronym */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      College Full Name
                    </label>
                    <input
                      type="text"
                      value={newCollegeName}
                      onChange={(e) => setNewCollegeName(e.target.value)}
                      placeholder="e.g., Brigham Young University"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Acronym
                    </label>
                    <input
                      type="text"
                      value={newCollegeAcronym}
                      onChange={(e) => setNewCollegeAcronym(e.target.value)}
                      placeholder="e.g., BYU"
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Dark Mode Colors */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Dark Mode Colors
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={newCollegeDarkAccent}
                        onChange={(e) => setNewCollegeDarkAccent(e.target.value)}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>Accent</div>
                        <input
                          type="text"
                          value={newCollegeDarkAccent}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setNewCollegeDarkAccent(val);
                            }
                          }}
                          placeholder="#000000"
                          style={{
                            width: '70px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            backgroundColor: 'var(--panel-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={newCollegeDarkLink}
                        onChange={(e) => setNewCollegeDarkLink(e.target.value)}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>Link</div>
                        <input
                          type="text"
                          value={newCollegeDarkLink}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setNewCollegeDarkLink(val);
                            }
                          }}
                          placeholder="#000000"
                          style={{
                            width: '70px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            backgroundColor: 'var(--panel-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Light Mode Colors */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Light Mode Colors
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={newCollegeLightAccent}
                        onChange={(e) => setNewCollegeLightAccent(e.target.value)}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>Accent</div>
                        <input
                          type="text"
                          value={newCollegeLightAccent}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setNewCollegeLightAccent(val);
                            }
                          }}
                          placeholder="#000000"
                          style={{
                            width: '70px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            backgroundColor: 'var(--panel-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={newCollegeLightLink}
                        onChange={(e) => setNewCollegeLightLink(e.target.value)}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>Link</div>
                        <input
                          type="text"
                          value={newCollegeLightLink}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setNewCollegeLightLink(val);
                            }
                          }}
                          placeholder="#000000"
                          style={{
                            width: '70px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            backgroundColor: 'var(--panel-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Quick Links
                    </label>
                    <button
                      onClick={addQuickLinkField}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        backgroundColor: accentColor,
                        backgroundImage: settings.theme === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                          : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                      }}
                    >
                      <Plus size={14} />
                      Add Link
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newCollegeQuickLinks.map((link, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: isMobile ? 'stretch' : 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: isMobile ? undefined : 1 }}>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateQuickLink(index, 'label', e.target.value)}
                            placeholder="Label"
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '13px',
                              backgroundColor: 'var(--panel-2)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text)',
                              outline: 'none',
                              minWidth: 0,
                            }}
                          />
                          {isMobile && newCollegeQuickLinks.length > 1 && (
                            <button
                              onClick={() => removeQuickLinkField(index)}
                              style={{
                                padding: '6px',
                                backgroundColor: 'var(--danger-bg)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: 'var(--danger)',
                                flexShrink: 0,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                          placeholder="URL"
                          style={{
                            flex: isMobile ? undefined : 2,
                            padding: '8px 10px',
                            fontSize: '13px',
                            backgroundColor: 'var(--panel-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: 'var(--text)',
                            outline: 'none',
                            minWidth: 0,
                          }}
                        />
                        {!isMobile && newCollegeQuickLinks.length > 1 && (
                          <button
                            onClick={() => removeQuickLinkField(index)}
                            style={{
                              padding: '6px',
                              backgroundColor: 'var(--danger-bg)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: 'var(--danger)',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  {/* Primary Action - Add or Update */}
                  <button
                    onClick={handleAddOrUpdateCollege}
                    disabled={addCollegeLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: accentColor,
                      backgroundImage: settings.theme === 'light'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                        : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: addCollegeLoading ? 'not-allowed' : 'pointer',
                      opacity: addCollegeLoading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                    }}
                  >
                    <GraduationCap size={18} />
                    {addCollegeLoading
                      ? (editingCollegeId ? 'Updating...' : 'Adding...')
                      : (editingCollegeId ? 'Update College' : 'Add College')}
                  </button>

                  {/* Secondary Actions - Only show when editing */}
                  {editingCollegeId && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Toggle Active Status */}
                      <button
                        onClick={() => {
                          const college = colleges.find(c => c.id === editingCollegeId);
                          if (college) handleToggleCollegeActive(college);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          backgroundColor: 'var(--panel-2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {colleges.find(c => c.id === editingCollegeId)?.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => confirmDeleteCollege(editingCollegeId)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                          border: '1px solid #660000',
                          borderRadius: '8px',
                          color: selectedTheme === 'light' ? '#000000' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}

                  {addCollegeMessage && (
                    <p style={{
                      fontSize: '13px',
                      color: addCollegeMessage.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                      margin: 0,
                      textAlign: 'center',
                    }}>
                      {addCollegeMessage}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Preview Section */}
            <Card title="Site Preview">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Theme Toggle */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPreviewTheme('dark')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: previewTheme === 'dark' ? 'var(--accent)' : 'var(--panel-2)',
                      backgroundImage: previewTheme === 'dark' ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: previewTheme === 'dark' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Dark Mode
                  </button>
                  <button
                    onClick={() => setPreviewTheme('light')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: previewTheme === 'light' ? 'var(--accent)' : 'var(--panel-2)',
                      backgroundImage: previewTheme === 'light' ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: previewTheme === 'light' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Light Mode
                  </button>
                </div>

                {/* Mini Site Preview */}
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  backgroundColor: previewTheme === 'dark' ? '#0a0a0b' : '#fafafa',
                  minHeight: '340px',
                  display: 'flex',
                }}>
                  {/* Floating Sidebar */}
                  <div style={{
                    width: '120px',
                    padding: '8px',
                  }}>
                    <div style={{
                      backgroundColor: previewTheme === 'dark' ? '#111113' : '#ffffff',
                      border: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                      borderRadius: '10px',
                      padding: '12px 8px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: previewTheme === 'dark' ? '0 4px 24px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.06)',
                    }}>
                      {/* App Title */}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                        padding: '0 4px',
                        marginBottom: '4px',
                      }}>
                        {newCollegeAcronym || 'XXX'} Orbit
                      </div>
                      {/* User name */}
                      <div style={{
                        fontSize: '9px',
                        color: previewTheme === 'dark' ? '#a1a1aa' : '#71717a',
                        padding: '0 4px',
                        marginBottom: '12px',
                      }}>
                        John Doe
                      </div>

                      {/* Nav Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        {[
                          { label: 'Dashboard', active: true },
                          { label: 'Calendar', active: false },
                          { label: 'Tasks', active: false },
                          { label: 'Courses', active: false },
                          { label: 'Settings', active: false },
                        ].map((item) => (
                          <div
                            key={item.label}
                            style={{
                              padding: '8px 8px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: item.active
                                ? (previewTheme === 'dark' ? newCollegeDarkAccent : newCollegeLightAccent)
                                : 'transparent',
                              backgroundImage: item.active
                                ? 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                                : 'none',
                              color: item.active
                                ? 'white'
                                : (previewTheme === 'dark' ? '#71717a' : '#a1a1aa'),
                              boxShadow: item.active
                                ? `0 0 12px ${previewTheme === 'dark' ? newCollegeDarkAccent : newCollegeLightAccent}40`
                                : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: item.active ? 'rgba(255,255,255,0.3)' : (previewTheme === 'dark' ? '#3f3f46' : '#d4d4d8'),
                            }} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div style={{
                    flex: 1,
                    padding: '16px 16px 16px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflow: 'hidden',
                  }}>
                    {/* Page Header */}
                    <div>
                      <h2 style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                        margin: 0,
                      }}>
                        Dashboard
                      </h2>
                      <p style={{
                        fontSize: '10px',
                        color: previewTheme === 'dark' ? '#a1a1aa' : '#71717a',
                        margin: '2px 0 0 0',
                      }}>
                        Welcome to {newCollegeName || 'Your College'}
                      </p>
                    </div>

                    {/* Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Quick Links Card */}
                      <div style={{
                        backgroundColor: previewTheme === 'dark' ? '#111113' : '#ffffff',
                        borderTop: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderRight: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderBottom: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderLeft: `3px solid ${previewTheme === 'dark' ? newCollegeDarkAccent : newCollegeLightAccent}55`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: previewTheme === 'dark' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <h3 style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                          margin: '0 0 6px 0',
                        }}>
                          Quick Links
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          {(newCollegeQuickLinks.filter(l => l.label).length > 0
                            ? newCollegeQuickLinks.filter(l => l.label).slice(0, 4)
                            : [{ label: 'Home' }, { label: 'Portal' }, { label: 'Library' }, { label: 'Email' }]
                          ).map((link, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: '8px',
                                fontWeight: '500',
                                color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                                backgroundColor: previewTheme === 'dark' ? '#1a1a1c' : '#f4f4f5',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: `1.5px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                              }}
                            >
                              {link.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tasks Card with Links */}
                      <div style={{
                        backgroundColor: previewTheme === 'dark' ? '#111113' : '#ffffff',
                        borderTop: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderRight: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderBottom: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderLeft: `3px solid ${previewTheme === 'dark' ? newCollegeDarkAccent : newCollegeLightAccent}55`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: previewTheme === 'dark' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <h3 style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                          margin: '0 0 6px 0',
                        }}>
                          Today&apos;s Tasks
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '3px',
                              border: `1.5px solid ${previewTheme === 'dark' ? '#3f3f46' : '#d4d4d8'}`,
                            }} />
                            <span style={{ fontSize: '9px', color: previewTheme === 'dark' ? '#fafafa' : '#09090b' }}>
                              Complete homework -
                            </span>
                            <span style={{
                              fontSize: '9px',
                              color: previewTheme === 'dark' ? newCollegeDarkLink : newCollegeLightLink,
                              cursor: 'pointer',
                            }}>
                              View Details
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '3px',
                              border: `1.5px solid ${previewTheme === 'dark' ? '#3f3f46' : '#d4d4d8'}`,
                            }} />
                            <span style={{ fontSize: '9px', color: previewTheme === 'dark' ? '#fafafa' : '#09090b' }}>
                              Study for exam -
                            </span>
                            <span style={{
                              fontSize: '9px',
                              color: previewTheme === 'dark' ? newCollegeDarkLink : newCollegeLightLink,
                              cursor: 'pointer',
                            }}>
                              Open Notes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deadlines Card */}
                      <div style={{
                        backgroundColor: previewTheme === 'dark' ? '#111113' : '#ffffff',
                        borderTop: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderRight: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderBottom: `1px solid ${previewTheme === 'dark' ? '#252528' : '#e5e5e5'}`,
                        borderLeft: `3px solid ${previewTheme === 'dark' ? newCollegeDarkAccent : newCollegeLightAccent}55`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: previewTheme === 'dark' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <h3 style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: previewTheme === 'dark' ? '#fafafa' : '#09090b',
                          margin: '0 0 6px 0',
                        }}>
                          Upcoming Deadlines
                        </h3>
                        <div style={{ fontSize: '9px', color: previewTheme === 'dark' ? '#a1a1aa' : '#71717a' }}>
                          Project Due · Jan 25 ·{' '}
                          <span style={{ color: previewTheme === 'dark' ? newCollegeDarkLink : newCollegeLightLink, cursor: 'pointer' }}>
                            View Assignment
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Legend */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: previewTheme === 'dark' ? 'var(--panel-2)' : 'var(--panel)',
                    border: `2px solid ${previewTheme === 'dark' ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Dark Theme</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: newCollegeDarkAccent,
                          boxShadow: `0 0 8px ${newCollegeDarkAccent}60`,
                        }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Accent</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: newCollegeDarkLink,
                        }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Link</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: previewTheme === 'light' ? 'var(--panel-2)' : 'var(--panel)',
                    border: `2px solid ${previewTheme === 'light' ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Light Theme</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: newCollegeLightAccent,
                          boxShadow: `0 0 8px ${newCollegeLightAccent}60`,
                        }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Accent</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: newCollegeLightLink,
                        }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Link</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Existing Colleges List - Full Width */}
            {colleges.length > 0 && (
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <Card title={`All Colleges (${colleges.length})`}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                    {colleges.map((college) => (
                      <div
                        key={college.id}
                        onClick={() => {
                          setActiveTab('addCollege');
                          loadCollegeForEdit(college);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 16px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: college.isActive ? 1 : 0.6,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel)';
                          e.currentTarget.style.borderColor = 'var(--border-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: `linear-gradient(135deg, ${college.darkAccent}, ${college.lightAccent})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <GraduationCap size={20} style={{ color: 'white' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
                                {college.acronym}
                              </span>
                              {!college.isActive && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  backgroundColor: 'var(--warning-bg)',
                                  color: 'var(--warning)',
                                  borderRadius: '4px',
                                  fontWeight: '500',
                                }}>
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {college.fullName}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {/* Color swatches */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                backgroundColor: college.darkAccent,
                                border: '1px solid var(--border)',
                              }}
                              title={`Dark: ${college.darkAccent}`}
                            />
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                backgroundColor: college.lightAccent,
                                border: '1px solid var(--border)',
                              }}
                              title={`Light: ${college.lightAccent}`}
                            />
                          </div>
                          {/* Quick Links count */}
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--panel)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}>
                            {college.quickLinks?.length || 0} links
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== Beta Tab ==================== */}
      {activeTab === 'beta' && (
        <div style={{ padding: isMobile ? '0 16px 32px 16px' : '0 24px 32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '24px' }}>

            {/* Beta Sub-tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'users', label: 'Beta Users' },
                { id: 'feedback', label: 'Feedback' },
                { id: 'versions', label: 'Versions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBetaSubTab(tab.id as 'users' | 'feedback' | 'versions')}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    betaSubTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={{
                    padding: '10px 18px',
                    fontSize: '14px',
                    backgroundColor: betaSubTab === tab.id ? 'var(--panel-2)' : 'transparent',
                    border: betaSubTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  {tab.label}
                  {tab.id === 'users' && betaUsers.length > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      ({betaUsers.length})
                    </span>
                  )}
                  {tab.id === 'feedback' && betaFeedbackList.filter(f => f.status === 'pending').length > 0 && (
                    <span style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '11px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '8px' }}>
                      {betaFeedbackList.filter(f => f.status === 'pending').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Beta Users */}
            {betaSubTab === 'users' && (
              <Card title={`Beta Users (${betaUsers.length})`}>
                {betaUsers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No users have joined the beta program yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
                    {betaUsers.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--panel-2)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>
                            {user.name || user.email}
                          </p>
                          {user.name && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                              {user.email}
                            </p>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Beta Feedback */}
            {betaSubTab === 'feedback' && (
              <Card title="Beta Feedback">
                {betaFeedbackList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No feedback submitted yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                    {betaFeedbackList.map((feedback) => (
                      <div
                        key={feedback.id}
                        style={{
                          padding: '16px',
                          backgroundColor: selectedFeedback?.id === feedback.id ? 'var(--panel)' : 'var(--panel-2)',
                          borderRadius: '8px',
                          border: selectedFeedback?.id === feedback.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedFeedback(selectedFeedback?.id === feedback.id ? null : feedback);
                          setAdminResponse(feedback.adminResponse || '');
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>
                              {feedback.user.name || feedback.user.email}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                              {new Date(feedback.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '500',
                              borderRadius: '6px',
                              backgroundColor: feedback.status === 'pending' ? 'var(--warning-bg)' : feedback.status === 'reviewed' ? 'var(--info-bg)' : 'var(--success-bg)',
                              color: feedback.status === 'pending' ? 'var(--warning)' : feedback.status === 'reviewed' ? 'var(--info)' : 'var(--success)',
                            }}
                          >
                            {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {selectedFeedback?.id === feedback.id ? feedback.description : (feedback.description.length > 150 ? feedback.description.substring(0, 150) + '...' : feedback.description)}
                        </p>

                        {/* Expanded view with response form */}
                        {selectedFeedback?.id === feedback.id && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                            {feedback.adminResponse && (
                              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
                                  Previous Response:
                                </p>
                                <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {feedback.adminResponse}
                                </p>
                              </div>
                            )}
                            <textarea
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              placeholder="Write a response to the user..."
                              style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '8px 12px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                backgroundColor: 'var(--panel-2)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={betaResponseLoading}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!adminResponse.trim()) return;
                                  setBetaResponseLoading(true);
                                  try {
                                    const res = await fetch('/api/admin/beta-feedback', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: feedback.id, adminResponse: adminResponse.trim(), status: 'reviewed' }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setBetaFeedbackList(list => list.map(f => f.id === feedback.id ? data.feedback : f));
                                      setSelectedFeedback(null);
                                      setAdminResponse('');
                                    }
                                  } catch (err) {
                                    console.error('Error responding:', err);
                                  } finally {
                                    setBetaResponseLoading(false);
                                  }
                                }}
                                disabled={!adminResponse.trim() || betaResponseLoading}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  backgroundColor: accentColor,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: !adminResponse.trim() || betaResponseLoading ? 'not-allowed' : 'pointer',
                                  opacity: !adminResponse.trim() || betaResponseLoading ? 0.6 : 1,
                                }}
                              >
                                {betaResponseLoading ? 'Sending...' : 'Send Response'}
                              </button>
                              {feedback.status !== 'resolved' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setBetaResponseLoading(true);
                                    try {
                                      const res = await fetch('/api/admin/beta-feedback', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: feedback.id, status: 'resolved' }),
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        setBetaFeedbackList(list => list.map(f => f.id === feedback.id ? data.feedback : f));
                                        setSelectedFeedback(null);
                                      }
                                    } catch (err) {
                                      console.error('Error updating status:', err);
                                    } finally {
                                      setBetaResponseLoading(false);
                                    }
                                  }}
                                  disabled={betaResponseLoading}
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    backgroundColor: 'var(--panel-2)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    cursor: betaResponseLoading ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* App Versions */}
            {betaSubTab === 'versions' && (
              <Card title={`App Versions (${appVersions.length})`}>
                  {appVersions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No versions added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {appVersions.map((version) => (
                        <div
                          key={version.id}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                                v{version.version}
                              </p>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  borderRadius: '6px',
                                  backgroundColor: version.isBetaOnly ? 'var(--warning-bg)' : 'var(--success-bg)',
                                  color: version.isBetaOnly ? 'var(--warning)' : 'var(--success)',
                                }}
                              >
                                {version.isBetaOnly ? 'Beta Only' : 'Released'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                                {new Date(version.releasedAt).toLocaleDateString()}
                              </p>
                              {version.isBetaOnly && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/admin/app-versions', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: version.id, isBetaOnly: false }),
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        setAppVersions(list => list.map(v => v.id === version.id ? data.version : v));
                                      }
                                    } catch (err) {
                                      console.error('Error releasing version:', err);
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: 'var(--success-bg)',
                                    color: 'var(--success)',
                                    border: '1px solid var(--success)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Release to All
                                </button>
                              )}
                            </div>
                          </div>
                          {version.changes && version.changes.length > 0 && (
                            <ul style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0 0', paddingLeft: '16px' }}>
                              {version.changes.slice(0, 3).map((change, idx) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>{change}</li>
                              ))}
                              {version.changes.length > 3 && (
                                <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  +{version.changes.length - 3} more changes
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
            )}
          </div>
        </div>
      )}

      {/* ==================== Modals ==================== */}

      {/* Delete college confirmation modal */}
      {showDeleteCollegeConfirm && (
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
              Delete College?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will permanently delete this college and remove it from all users. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteCollegeConfirm(false);
                  setDeleteCollegeId(null);
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
                Cancel
              </button>
              <button
                onClick={handleDeleteCollege}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete college request confirmation modal */}
      {showDeleteRequestConfirm && (
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
              Reject Request?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will mark the college request as rejected. The user will be notified of the rejection.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteRequestConfirm(false);
                  setDeleteRequestId(null);
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
                Cancel
              </button>
              <button
                onClick={confirmDeleteRequest}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete issue report confirmation modal */}
      {showDeleteIssueConfirm && (
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
              Reject Report?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will mark the issue report as rejected. The user will be notified that their report was reviewed and closed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteIssueConfirm(false);
                  setDeleteIssueId(null);
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
                Cancel
              </button>
              <button
                onClick={confirmDeleteIssue}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View issue report modal */}
      {showIssueModal && selectedIssue && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              Issue Report
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '12px' }}>
              Reported by {selectedIssue.user.name || selectedIssue.user.email}
            </p>
            <div style={{
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              minHeight: '100px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedIssue.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setSelectedIssue(null);
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
                Close
              </button>
              <button
                onClick={() => {
                  handleMarkIssueFixed(selectedIssue.id);
                  setShowIssueModal(false);
                  setSelectedIssue(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--success)' : '#063d1d'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Mark Fixed
              </button>
              <button
                onClick={() => {
                  handleDeleteIssue(selectedIssue.id);
                  setShowIssueModal(false);
                  setSelectedIssue(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--danger)' : '#660000'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete feature request confirmation modal */}
      {showDeleteFeatureConfirm && (
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
              Reject Request?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will mark the feature request as rejected. The user will be notified that their request was reviewed and closed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteFeatureConfirm(false);
                  setDeleteFeatureId(null);
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
                Cancel
              </button>
              <button
                onClick={confirmDeleteFeature}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View feature request modal */}
      {showFeatureModal && selectedFeature && (
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
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              Feature Request
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '12px' }}>
              Requested by {selectedFeature.user.name || selectedFeature.user.email}
            </p>
            <div style={{
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              minHeight: '100px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedFeature.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowFeatureModal(false);
                  setSelectedFeature(null);
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
                Close
              </button>
              <button
                onClick={() => {
                  handleMarkFeatureImplemented(selectedFeature.id);
                  setShowFeatureModal(false);
                  setSelectedFeature(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--success)' : '#063d1d'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Mark Implemented
              </button>
              <button
                onClick={() => {
                  handleDeleteFeature(selectedFeature.id);
                  setShowFeatureModal(false);
                  setSelectedFeature(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: selectedTheme === 'light' ? '#000000' : 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--danger)' : '#660000'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
