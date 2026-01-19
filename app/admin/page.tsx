'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { collegeColorPalettes, collegeColorPalettesLight, getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Crown, Shield, ExternalLink } from 'lucide-react';

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
  const settings = useAppStore((state) => state.settings);
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');
  const accentColor = settings.useCustomTheme && settings.customColors
    ? getCustomColorSetForTheme(settings.customColors as CustomColors, settings.theme || 'dark').accent
    : colorPalette.accent;
  const glowIntensity = settings.glowIntensity ?? 50;
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');

  // Main tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'management'>('management');

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
  const [adminTab, setAdminTab] = useState<'college' | 'issues' | 'features'>('college');

  // Grant premium state
  const [grantPremiumInput, setGrantPremiumInput] = useState('');
  const [grantPremiumLoading, setGrantPremiumLoading] = useState(false);
  const [grantPremiumMessage, setGrantPremiumMessage] = useState('');

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
  const [announcementTier, setAnnouncementTier] = useState<'all' | 'free' | 'trial' | 'premium' | 'lifetime' | 'admin'>('all');
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
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
  }, [session, router]);

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

    setAnnouncementLoading(true);
    setAnnouncementResult('');

    try {
      const response = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMessage,
          tierFilter: announcementTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnnouncementResult(`Error: ${data.error}`);
        setAnnouncementLoading(false);
        setTimeout(() => setAnnouncementResult(''), 5000);
        return;
      }

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
      setAnnouncementResult(`Success: ${data.message} (${emailInfo})`);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
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
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ position: 'absolute', inset: '-20px -30px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colorPalette.accent}18 0%, transparent 70%)`,
                }}
              />
            </div>
            <h1
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: isMobile ? '26px' : '34px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Admin
            </h1>
          </div>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Manage your application.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '0 20px' : '0 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'management', label: 'Management' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'analytics' | 'management')}
              className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                activeTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--nav-active)' : 'transparent',
                backgroundImage: activeTab === tab.id ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
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
        <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0' }}>
          <div className="flex items-center justify-center" style={{ height: '200px' }}>
            <div className="text-[var(--text-muted)]">Loading analytics...</div>
          </div>
        </div>
      ) : analyticsError ? (
        <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0' }}>
          <div className="flex items-center justify-center" style={{ height: '200px' }}>
            <div className="text-[var(--text-muted)]">Error: {analyticsError}</div>
          </div>
        </div>
      ) : analytics && (
        <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          <div className="w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--grid-gap)' }}>
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
                    const uniColorPalette = isDarkMode
                      ? collegeColorPalettes[item.university]
                      : collegeColorPalettesLight[item.university];
                    const accentColor = uniColorPalette?.accent || '#666666';

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
                            backgroundColor: accentColor,
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
        <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          {/* External Services Card - Full Width */}
          <div style={{ marginBottom: isMobile ? '8px' : '24px' }}>
            <Card title="External Services">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
              <a
                href="https://dashboard.stripe.com/acct_1Sr2ZaPr50btBHL1/dashboard"
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
              </div>
            </Card>
          </div>

          <div className="w-full" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--grid-gap)' }}>
            {/* Admin Requests Card */}
            <Card title="Requests">
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
                                color: 'white',
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
                              color: 'white',
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
                              color: 'white',
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
                              color: 'white',
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
                              color: 'white',
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
                              color: 'white',
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

            {/* Grant Lifetime Premium Card */}
            <Card title="Grant Lifetime Premium">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Grant a user lifetime premium access. They will receive a notification and have permanent premium access.
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                  {!isMobile && <Crown size={24} style={{ color: 'white', flexShrink: 0 }} />}
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
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: grantPremiumLoading ? 'not-allowed' : 'pointer',
                      opacity: grantPremiumLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                    }}
                  >
                    {grantPremiumLoading ? 'Granting...' : 'Grant Premium'}
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
            </Card>

            {/* Grant Admin Card */}
            <Card title="Grant Admin Access">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Grant a user admin access. They will receive a notification and have access to the Admin panel. Admins automatically receive lifetime premium.
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px' }}>
                  {!isMobile && <Shield size={24} style={{ color: 'white', flexShrink: 0 }} />}
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
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
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
                              color: 'white',
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
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
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
                            color: 'white',
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
                            color: 'white',
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
                  Send a notification and email to all users or filter by subscription tier.
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Send to:</label>
                  <select
                    value={announcementTier}
                    onChange={(e) => setAnnouncementTier(e.target.value as 'all' | 'free' | 'trial' | 'premium' | 'lifetime' | 'admin')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="trial">Trial Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="lifetime">Lifetime Premium</option>
                    <option value="admin">Admins</option>
                  </select>
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={announcementLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
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

      {/* ==================== Modals ==================== */}

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
                  backgroundColor: '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
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
                  backgroundColor: '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
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
                  color: 'white',
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
                  color: 'white',
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
                  backgroundColor: '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
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
                  color: 'white',
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
                  color: 'white',
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
