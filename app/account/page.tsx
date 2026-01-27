'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Shield, Download, Upload, Trash2, Eye, EyeOff, Crown, Monitor, Smartphone, Tablet, X, Calendar, Copy, FileText, Camera, Users, UserPlus, UserMinus, Check, Clock, Gift } from 'lucide-react';
import { exportWorkItemsToPDF, exportScheduleToPDF } from '@/lib/pdfExport';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { useSubscription } from '@/hooks/useSubscription';
import { showSuccessToast, showErrorToast } from '@/components/ui/DeleteToast';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { exportData, importData, deleteAllData, fetchFriends, fetchFriendRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, removeFriend, friends, pendingFriendRequests, sentFriendRequests, colleges, fetchColleges, updateSettings, settings } = useAppStore();
  const subscription = useSubscription();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Profile fields
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [collegeLoading, setCollegeLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // Friends
  const [friendIdentifier, setFriendIdentifier] = useState('');
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [pdfExportMessage, setPdfExportMessage] = useState('');
  const [activeSessions, setActiveSessions] = useState<Array<{
    id: string;
    browser: string | null;
    os: string | null;
    device: string | null;
    ipAddress: string | null;
    city: string | null;
    country: string | null;
    lastActivityAt: string;
    createdAt: string;
    isCurrent: boolean;
  }>>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Referral program state
  const [, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    successfulReferrals: number;
    monthsEarned: number;
  } | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    // Refresh session on mount to get latest data (including lastLogin)
    updateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  // Fetch profile data (including username, profileImage, college)
  const [profileCollegeId, setProfileCollegeId] = useState<string | null | undefined>(undefined);
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    if (!session?.user || hasFetchedProfile.current) return;

    const fetchProfile = async () => {
      hasFetchedProfile.current = true;
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUsername(data.user.username || '');
          setProfileImage(data.user.profileImage || null);
          setProfileCollegeId(data.user.collegeId || null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        hasFetchedProfile.current = false; // Allow retry on error
      }
    };

    fetchProfile();
  }, [session?.user]);

  // Initialize collegeId once we have both profile data and colleges loaded
  useEffect(() => {
    // Wait for profile fetch to complete and colleges to load
    if (profileCollegeId === undefined || colleges.length === 0) return;

    // Profile has collegeId - use it
    if (profileCollegeId) {
      setCollegeId(profileCollegeId);
      setCollegeLoading(false);
      return;
    }

    // No profile collegeId, try to get from settings.university
    if (settings.university) {
      const college = colleges.find(c => c.fullName === settings.university);
      if (college?.id) {
        setCollegeId(college.id);
      }
    }
    setCollegeLoading(false);
  }, [profileCollegeId, settings.university, colleges]);

  // Fetch friends, friend requests, and colleges on mount
  useEffect(() => {
    if (!session?.user) return;

    fetchFriends();
    fetchFriendRequests();
    fetchColleges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  // Username availability check with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setUsernameAvailable(data.available);
        }
      } catch (err) {
        console.error('Failed to check username:', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [username]);

  // Fetch active sessions (registration handled globally in SessionRegistrar)
  useEffect(() => {
    if (!session?.user) return;

    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/user/sessions');
        if (response.ok) {
          const data = await response.json();
          setActiveSessions(data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [session]);

  // Fetch calendar token
  useEffect(() => {
    if (!session?.user) return;

    const fetchCalendarToken = async () => {
      try {
        const response = await fetch('/api/calendar/token');
        if (response.ok) {
          const data = await response.json();
          setCalendarToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch calendar token:', err);
      }
    };

    fetchCalendarToken();
  }, [session]);

  // Fetch referral data
  useEffect(() => {
    if (!session?.user) return;

    const fetchReferralData = async () => {
      try {
        const response = await fetch('/api/referral');
        if (response.ok) {
          const data = await response.json();
          setReferralCode(data.referralCode);
          setReferralLink(data.referralLink);
          setReferralStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch referral data:', err);
      }
    };

    fetchReferralData();
  }, [session]);

  const handleCopyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setReferralCopied(true);
      showSuccessToast('Referral link copied!');
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const handleCalendarDownload = async () => {
    setCalendarLoading(true);
    try {
      const response = await fetch('/api/calendar/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'college-orbit-calendar.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setCalendarMessage('Calendar downloaded successfully');
        setTimeout(() => setCalendarMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to download calendar:', err);
      setCalendarMessage('Failed to download calendar');
      setTimeout(() => setCalendarMessage(''), 3000);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCopyCalendarUrl = async () => {
    if (!calendarToken) return;
    const url = `${window.location.origin}/api/calendar/ical/${calendarToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCalendarMessage('URL copied to clipboard');
      setTimeout(() => setCalendarMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCalendarMessage('Failed to copy URL');
      setTimeout(() => setCalendarMessage(''), 3000);
    }
  };

  // Helper to format recurring pattern as human-readable text
  const formatRecurrenceInfo = (pattern: any): string => {
    if (!pattern) return '';
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let text = '';

    switch (pattern.recurrenceType) {
      case 'daily':
        text = 'Every day';
        break;
      case 'weekly': {
        const days = (pattern.daysOfWeek || [])
          .sort((a: number, b: number) => a - b)
          .map((d: number) => dayNames[d]);
        text = days.length > 0 ? `Every ${days.join(', ')}` : 'Weekly';
        break;
      }
      case 'monthly': {
        const dates = (pattern.daysOfMonth || [])
          .sort((a: number, b: number) => a - b)
          .map((d: number) => {
            const suffix = ['th', 'st', 'nd', 'rd'][(d % 10 > 3 || Math.floor(d / 10) === 1) ? 0 : d % 10];
            return `${d}${suffix}`;
          });
        text = dates.length > 0 ? `Monthly on the ${dates.join(', ')}` : 'Monthly';
        break;
      }
      case 'custom': {
        const interval = pattern.intervalDays || 1;
        text = `Every ${interval} day${interval > 1 ? 's' : ''}`;
        break;
      }
      default:
        text = 'Recurring';
    }

    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      text += ` until ${endDate}`;
    } else if (pattern.occurrenceCount) {
      text += ` (${pattern.occurrenceCount} times)`;
    }

    return text;
  };

  const handleExportWorkItemsPDF = async () => {
    setPdfExportLoading(true);
    setPdfExportMessage('');
    try {
      // Fetch work items and courses
      const [workRes, coursesRes] = await Promise.all([
        fetch('/api/work?showAll=true'),
        fetch('/api/courses'),
      ]);

      if (!workRes.ok || !coursesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const workData = await workRes.json();
      const coursesData = await coursesRes.json();
      const courses = coursesData.courses || [];
      const allItems = workData.workItems || [];

      // For recurring items, only keep one instance per pattern (earliest open one)
      const seenPatterns = new Set<string>();
      const filteredItems = allItems
        .filter((item: any) => item.status !== 'done')
        .sort((a: any, b: any) => {
          // Sort by due date (earliest first)
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        })
        .filter((item: any) => {
          // For recurring items, only include the first instance per pattern
          if (item.recurringPatternId) {
            if (seenPatterns.has(item.recurringPatternId)) {
              return false;
            }
            seenPatterns.add(item.recurringPatternId);
          }
          return true;
        });

      // Map to export format with recurring info
      const itemsForExport = filteredItems.map((item: any) => {
        const course = item.courseId ? courses.find((c: any) => c.id === item.courseId) : null;
        return {
          title: item.title,
          type: item.type,
          dueAt: item.dueAt,
          priority: item.priority || null,
          effort: item.effort || null,
          status: item.status,
          course: course ? { name: course.name, code: course.code } : null,
          notes: item.notes || '',
          tags: item.tags || [],
          links: item.links || [],
          checklist: item.checklist || [],
          isRecurring: item.isRecurring || !!item.recurringPatternId,
          recurringInfo: item.recurringPattern ? formatRecurrenceInfo(item.recurringPattern) : undefined,
        };
      });

      if (itemsForExport.length === 0) {
        setPdfExportMessage('No open work items to export');
        setTimeout(() => setPdfExportMessage(''), 3000);
        return;
      }

      exportWorkItemsToPDF(itemsForExport, {
        title: 'Work Items',
      });

      setPdfExportMessage('Work items exported successfully');
      setTimeout(() => setPdfExportMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export work items PDF:', err);
      setPdfExportMessage('Failed to export work items');
      setTimeout(() => setPdfExportMessage(''), 3000);
    } finally {
      setPdfExportLoading(false);
    }
  };

  const handleExportSchedulePDF = async () => {
    setPdfExportLoading(true);
    setPdfExportMessage('');
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      const coursesForExport = (data.courses || []).map((course: any) => ({
        name: course.name,
        code: course.code,
        meetingTimes: (course.meetingTimes || []) as Array<{
          days: string[];
          start: string;
          end: string;
          location?: string;
        }>,
        colorTag: course.colorTag,
      }));

      exportScheduleToPDF(coursesForExport, {
        title: 'Weekly Class Schedule',
      });

      setPdfExportMessage('Schedule exported successfully');
      setTimeout(() => setPdfExportMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export schedule PDF:', err);
      setPdfExportMessage('Failed to export schedule');
      setTimeout(() => setPdfExportMessage(''), 3000);
    } finally {
      setPdfExportLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await fetch(`/api/user/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const formatSessionTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (device: string | null) => {
    if (!device) return <Monitor size={18} />;
    const d = device.toLowerCase();
    if (d.includes('mobile') || d.includes('phone')) return <Smartphone size={18} />;
    if (d.includes('tablet') || d.includes('ipad')) return <Tablet size={18} />;
    return <Monitor size={18} />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
      showErrorToast('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = { name, email };
      if (password) {
        updateData.password = password;
      }
      if (username !== undefined) {
        updateData.username = username;
      }
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage;
      }
      if (collegeId !== undefined) {
        updateData.collegeId = collegeId || '';
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        showErrorToast(error || 'Failed to update account');
        setLoading(false);
        return;
      }

      showSuccessToast('Account updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);

      // Refresh the session to update user data
      await updateSession();

      // Refresh the page data
      router.refresh();
    } catch (err) {
      showErrorToast('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLogoutLoading(true);
    setSecuritySuccess('');

    try {
      const response = await fetch('/api/user/sessions', {
        method: 'POST',
      });

      if (!response.ok) {
        setLogoutLoading(false);
        return;
      }

      setSecuritySuccess('All sessions have been logged out. You will be redirected to login.');
      setLogoutLoading(false);

      // Sign out the current session after a brief delay
      setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, 2000);
    } catch (err) {
      setLogoutLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const filename = `college-orbit-backup-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage('✓ Data exported successfully');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('✗ We couldn\'t export your data. Please try again.');
      setTimeout(() => setExportMessage(''), 3000);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await importData(data);
        setImportMessage('✓ Data imported successfully!');
        setTimeout(() => setImportMessage(''), 3000);
      } catch (error) {
        console.error('Import error:', error);
        setImportMessage('✗ The file format isn\'t valid. Please make sure you\'re uploading a backup file exported from this app.');
        setTimeout(() => setImportMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAllData();
      setShowDeleteConfirm(false);
      setDeleteMessage('✓ All data deleted successfully');
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (error) {
      setDeleteMessage('✗ We couldn\'t delete your data. Please try again.');
      setTimeout(() => setDeleteMessage(''), 3000);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Sign out and redirect
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      setDeleteMessage('✗ We couldn\'t delete your account. Please try again.');
      setTimeout(() => setDeleteMessage(''), 3000);
      setShowDeleteAccountConfirm(false);
    }
  };

  // Profile image upload handler
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Profile image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send friend request handler
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendIdentifier.trim()) return;

    setFriendRequestLoading(true);

    const result = await sendFriendRequest(friendIdentifier.trim());

    if (result.success) {
      showSuccessToast('Friend request sent!');
      setFriendIdentifier('');
    } else {
      showErrorToast(result.error || 'Failed to send request');
    }

    setFriendRequestLoading(false);
  };

  // Handle accept/decline friend request
  const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    setProcessingRequestId(requestId);
    const result = action === 'accept'
      ? await acceptFriendRequest(requestId)
      : await declineFriendRequest(requestId);

    if (!result.success) {
      showErrorToast(result.error || `Failed to ${action} request`);
    }
    setProcessingRequestId(null);
  };

  // Handle cancel sent request
  const handleCancelRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    const result = await cancelFriendRequest(requestId);
    if (!result.success) {
      showErrorToast(result.error || 'Failed to cancel request');
    }
    setProcessingRequestId(null);
  };

  // Handle remove friend
  const handleRemoveFriend = async (friendId: string) => {
    setRemovingFriendId(friendId);
    const result = await removeFriend(friendId);
    if (!result.success) {
      showErrorToast(result.error || 'Failed to remove friend');
    }
    setRemovingFriendId(null);
  };

  const formatLastLogin = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Account Header */}
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
            Account
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Manage your account information.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-[var(--grid-gap)]">
          <Card title="Profile & Account">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Profile Photo Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--panel-2)',
                    border: '2px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </span>
                  )}
                </div>
                <div>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    {profileImage ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage(null)}
                      style={{
                        marginLeft: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Max 5MB. JPG, PNG, GIF.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Username field */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    maxLength={20}
                    style={{ paddingRight: '40px' }}
                  />
                  {username.length >= 3 && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {checkingUsername ? (
                        <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--link)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : usernameAvailable === true ? (
                        <Check size={16} style={{ color: 'var(--success)' }} />
                      ) : usernameAvailable === false ? (
                        <X size={16} style={{ color: 'var(--danger)' }} />
                      ) : null}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  3-20 characters, letters, numbers, and underscores only.
                  {username.length >= 3 && usernameAvailable === false && (
                    <span style={{ color: 'var(--danger)' }}> Username taken.</span>
                  )}
                </p>
              </div>

              {/* College selector */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                  University / College
                </label>
                <select
                  value={collegeId || ''}
                  onChange={(e) => {
                    const newCollegeId = e.target.value || null;
                    setCollegeId(newCollegeId);
                    // Sync with settings.university for theming
                    const selectedCollege = colleges.find(c => c.id === newCollegeId);
                    updateSettings({ university: selectedCollege?.fullName || null });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '40px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">{collegeLoading ? 'Loading...' : 'Select your school (optional)'}</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.fullName} ({college.acronym})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Used for college leaderboards and community features.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h3 className="text-base font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>
                  Change Password
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        minLength={8}
                        autoComplete="new-password"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: '6px' }}>
                      At least 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        minLength={8}
                        autoComplete="new-password"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Friends & Subscription Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--grid-gap)' }}>
          {/* Friends Section */}
          <Card style={{ flex: '1 1 auto', height: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Users size={20} style={{ color: 'var(--text)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Friends</h2>
            </div>


            {/* Pending Friend Requests */}
            {pendingFriendRequests.length > 0 && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
                  Pending Requests ({pendingFriendRequests.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingFriendRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {request.sender?.profileImage ? (
                            <img src={request.sender.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {request.sender?.name?.charAt(0) || request.sender?.username?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                            {request.sender?.name || request.sender?.username || 'Unknown'}
                          </p>
                          {request.sender?.username && request.sender?.name && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>@{request.sender.username}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleFriendRequestAction(request.id, 'accept')}
                          disabled={processingRequestId === request.id}
                          style={{
                            padding: '8px',
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--success)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: processingRequestId === request.id ? 'not-allowed' : 'pointer',
                            opacity: processingRequestId === request.id ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Accept"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleFriendRequestAction(request.id, 'decline')}
                          disabled={processingRequestId === request.id}
                          style={{
                            padding: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--danger)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: processingRequestId === request.id ? 'not-allowed' : 'pointer',
                            opacity: processingRequestId === request.id ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Decline"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Friend Form */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
                Add Friend
              </p>
              <form onSubmit={handleSendFriendRequest} style={{ display: 'flex', gap: '8px' }}>
                <Input
                  type="text"
                  value={friendIdentifier}
                  onChange={(e) => setFriendIdentifier(e.target.value)}
                  placeholder="Username or email"
                  style={{ flex: 1 }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size={isMobile ? 'sm' : 'lg'}
                  disabled={friendRequestLoading || !friendIdentifier.trim()}
                  style={{ paddingLeft: '16px', paddingRight: '16px' }}
                >
                  <UserPlus size={16} />
                  {friendRequestLoading ? 'Sending...' : 'Add'}
                </Button>
              </form>
            </div>

            {/* Sent Requests */}
            {sentFriendRequests.length > 0 && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
                  Sent Requests ({sentFriendRequests.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sentFriendRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {request.receiver?.profileImage ? (
                            <img src={request.receiver.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {request.receiver?.name?.charAt(0) || request.receiver?.username?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                            {request.receiver?.name || request.receiver?.username || 'Unknown'}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={processingRequestId === request.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: processingRequestId === request.id ? 'not-allowed' : 'pointer',
                          opacity: processingRequestId === request.id ? 0.5 : 1,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
                Your Friends ({friends.length})
              </p>
              {friends.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                  No friends yet. Add friends to compete on leaderboards!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {friend.profileImage ? (
                            <img src={friend.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {friend.name?.charAt(0) || friend.username?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                            {friend.name || friend.username || 'Unknown'}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                            {friend.username && `@${friend.username} · `}
                            Level {friend.xp.level} · {friend.xp.total.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={removingFriendId === friend.id}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: removingFriendId === friend.id ? 'not-allowed' : 'pointer',
                          opacity: removingFriendId === friend.id ? 0.5 : 1,
                        }}
                        title="Remove friend"
                        onMouseEnter={(e) => {
                          if (removingFriendId !== friend.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Subscription */}
          <Card style={{ flex: '1 1 auto', height: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Crown size={20} className="text-[var(--text)]" />
              <h2 className="text-lg font-semibold text-[var(--text)]">Subscription</h2>
            </div>

            {subscription.isLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            ) : (
              <div className="space-y-4">
                {/* Current Plan */}
                <div style={{ marginBottom: subscription.isLifetimePremium ? '8px' : '0' }}>
                  <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '4px' }}>Current Plan</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <p className="text-base font-medium text-[var(--text)]" style={{ margin: 0 }}>
                      {subscription.isLifetimePremium && 'Lifetime Premium'}
                      {subscription.tier === 'premium' && !subscription.isTrialing && !subscription.isLifetimePremium && (
                        <>Premium ({subscription.plan === 'yearly' ? 'Yearly' : subscription.plan === 'semester' ? 'Semester' : 'Monthly'})</>
                      )}
                      {subscription.isTrialing && 'Premium Trial'}
                      {subscription.tier === 'free' && 'Free'}
                    </p>
                    {subscription.isLifetimePremium && (
                      <span className="text-sm text-[var(--text-muted)]">
                        - granted by admin
                      </span>
                    )}
                    {subscription.status === 'canceled' && subscription.expiresAt && (
                      <span className="text-sm text-[var(--text-muted)]">
                        - expires {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {subscription.plan === 'semester' && subscription.expiresAt && subscription.status !== 'canceled' && (
                      <span className="text-sm text-[var(--text-muted)]">
                        - until {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Trial Info - only show if trial has days remaining */}
                {subscription.isTrialing && subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining > 0 && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: subscription.trialDaysRemaining <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent)10',
                      border: `1px solid ${subscription.trialDaysRemaining <= 3 ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent)20'}`,
                    }}
                  >
                    <p className="text-sm" style={{ color: subscription.trialDaysRemaining <= 3 ? '#ef4444' : 'var(--text)' }}>
                      <strong>{subscription.trialDaysRemaining} day{subscription.trialDaysRemaining !== 1 ? 's' : ''}</strong> left in your trial
                    </p>
                  </div>
                )}

                {/* Action Button */}
                {!subscription.isLifetimePremium && (
                  <div style={{ paddingTop: '12px', paddingBottom: subscription.isPremium ? '0' : '16px' }}>
                    {subscription.isPremium && !subscription.isTrialing ? (
                      <Link href="/subscription" className="block">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full"
                        >
                          Manage Subscription
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/pricing" className="block">
                        <Button variant="primary" size="lg" className="w-full">
                          <Crown size={18} />
                          {subscription.isTrialing ? 'Subscribe Now' : 'Upgrade to Premium'}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* Features List - for non-premium users */}
                {!subscription.isPremium && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>Premium includes:</p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1">
                      <li>• Unlimited notes & courses</li>
                      <li>• Calendar & Shopping pages</li>
                      <li>• All Tools (GPA, Pomodoro, etc.)</li>
                      <li>• File uploads & recurring items</li>
                      <li>• Custom themes & visual effects</li>
                    </ul>
                  </div>
                )}

                {/* Refer a Friend */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Gift size={16} className="text-[var(--text)]" />
                    <p className="text-sm font-semibold text-[var(--text)]" style={{ margin: 0 }}>Refer a Friend</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                    Earn <strong className="text-[var(--text)]">1 month of free premium</strong> for each friend who subscribes.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'var(--panel-2)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {referralLink || 'Loading...'}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyReferralLink}
                      disabled={!referralLink}
                      style={{ flexShrink: 0 }}
                    >
                      {referralCopied ? <Check size={14} /> : <Copy size={14} />}
                      {referralCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>

                  {referralStats && (referralStats.totalReferrals > 0 || referralStats.monthsEarned > 0) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        padding: '12px',
                        background: 'var(--panel-2)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-lg font-bold text-[var(--text)]" style={{ margin: 0 }}>{referralStats.totalReferrals}</p>
                        <p className="text-xs text-[var(--text-muted)]" style={{ margin: 0 }}>Referred</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-lg font-bold text-[var(--success)]" style={{ margin: 0 }}>{referralStats.successfulReferrals}</p>
                        <p className="text-xs text-[var(--text-muted)]" style={{ margin: 0 }}>Successful</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-lg font-bold" style={{ margin: 0, color: 'var(--link)' }}>{referralStats.monthsEarned}</p>
                        <p className="text-xs text-[var(--text-muted)]" style={{ margin: 0 }}>Months Earned</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features List - for premium users */}
                {subscription.isPremium && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '10px' }}>Your premium features:</p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px 16px',
                    }}>
                      {[
                        'Unlimited notes',
                        'Unlimited courses',
                        'Calendar page',
                        'Shopping lists',
                        'All Tools access',
                        'File attachments',
                        'Recurring items',
                        'Custom themes',
                        'Visual effects',
                      ].map((feature) => (
                        <div
                          key={feature}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--success)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          </div>

          {/* Data & Backup */}
          <Card title="Data & Backup">
            <div className="space-y-4">
              <div style={{ paddingBottom: '12px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>
                  Export your data
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Download a backup of all your data as a JSON file
                </p>
                <Button size={isMobile ? 'sm' : 'lg'} onClick={handleExport} style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}>
                  <Upload size={18} />
                  Export Data
                </Button>
                {exportMessage && (
                  <p className="text-sm text-[var(--success)]" style={{ marginTop: '8px' }}>{exportMessage}</p>
                )}
              </div>

              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px', paddingBottom: '12px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>
                  Import your data
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Restore data from a previous backup
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button variant="secondary" size={isMobile ? 'sm' : 'lg'} onClick={() => fileInputRef.current?.click()} style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}>
                  <Download size={18} />
                  Import Data
                </Button>
                {importMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: importMessage.includes('✓') ? 'var(--success)' : 'var(--danger)' }}>{importMessage}</p>
                )}
              </div>

              {/* Calendar Export */}
              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px', paddingBottom: '12px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} />
                  Export to Google Calendar / iCal
                  <HelpTooltip text="Download .ics: One-time export file to import into any calendar app. Subscription URL: Auto-syncing link that keeps your calendar updated when changes are made." size={14} width={260} />
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Export your deadlines, exams, tasks, and course schedule to Google Calendar, Apple Calendar, or any calendar app.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleCalendarDownload}
                    disabled={calendarLoading}
                    style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}
                  >
                    <Download size={18} />
                    Download .ics
                  </Button>
                  <Button
                    variant="secondary"
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleCopyCalendarUrl}
                    disabled={calendarLoading || !calendarToken}
                    style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}
                  >
                    <Copy size={18} />
                    Copy Subscription URL
                  </Button>
                </div>

                {calendarMessage && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: calendarMessage.includes('Failed') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {calendarMessage}
                  </p>
                )}
              </div>

              {/* PDF Export */}
              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px', paddingBottom: '12px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  Export to PDF
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Download printable PDFs of your work items or weekly class schedule.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <Button
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleExportWorkItemsPDF}
                    disabled={pdfExportLoading}
                    style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}
                  >
                    <Download size={18} />
                    Work Items PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={handleExportSchedulePDF}
                    disabled={pdfExportLoading}
                    style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}
                  >
                    <Calendar size={18} />
                    Schedule PDF
                  </Button>
                </div>

                {pdfExportMessage && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: pdfExportMessage.includes('Failed') ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {pdfExportMessage}
                  </p>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px' }}>
                <label className="block text-sm font-medium text-[var(--danger)]" style={{ marginBottom: '8px' }}>
                  Danger Zone
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Permanently delete your data or account. These actions cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <Button variant="danger" size={isMobile ? 'sm' : 'lg'} onClick={handleDeleteAllData} style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}>
                    <Trash2 size={18} />
                    Delete All Data
                  </Button>
                  <Button variant="danger" size={isMobile ? 'sm' : 'lg'} onClick={handleDeleteAccount} style={{ paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px' }}>
                    <Trash2 size={18} />
                    Delete Account
                  </Button>
                </div>
                {deleteMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: deleteMessage.includes('✓') ? 'var(--success)' : 'var(--danger)' }}>{deleteMessage}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Shield size={20} className="text-[var(--text)]" />
              <h2 className="text-lg font-semibold text-[var(--text)]">Security</h2>
            </div>

            {securitySuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3" style={{ marginBottom: '16px' }}>
                <p className="text-sm text-green-500">{securitySuccess}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Last Login</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {formatLastLogin((session?.user as any)?.lastLogin)}
                  </p>
                </div>
              </div>

              {/* Active Sessions */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>Active Sessions</p>
                {sessionsLoading ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading sessions...</p>
                ) : activeSessions.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No active sessions found</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeSessions.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: s.isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-2)',
                          borderRadius: '8px',
                          border: s.isCurrent ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: 'var(--text-muted)' }}>
                            {getDeviceIcon(s.device)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p className="text-sm font-medium text-[var(--text)]" style={{ margin: 0 }}>
                                {s.browser || 'Unknown'} on {s.os || 'Unknown'}
                              </p>
                              {s.isCurrent && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: '#3b82f6',
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}>
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)]" style={{ margin: '2px 0 0 0' }}>
                              {s.ipAddress && s.ipAddress !== 'Unknown' ? `${s.ipAddress} · ` : ''}
                              {s.city && s.country ? `${s.city}, ${s.country} · ` : ''}
                              Last active {formatSessionTime(s.lastActivityAt)}
                            </p>
                          </div>
                        </div>
                        {!s.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={revokingSessionId === s.id}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: revokingSessionId === s.id ? 'not-allowed' : 'pointer',
                              color: 'var(--text-muted)',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: revokingSessionId === s.id ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (revokingSessionId !== s.id) {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = '#ef4444';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                            title="Revoke this session"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Log Out of All Sessions</p>
                <p className="text-xs text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  This will log you out of all devices and browsers, including this one.
                </p>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={() => setShowLogoutConfirm(true)}
                  disabled={logoutLoading}
                  variant="danger"
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                  }}
                >
                  {logoutLoading ? 'Logging out...' : 'Log Out All Sessions'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete all data confirmation modal */}
      {showDeleteConfirm && (
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
              Delete All Data?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will permanently delete all your data including courses, tasks, and deadlines. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--delete-button)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
                  border: '1px solid var(--delete-button)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteAccountConfirm && (
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
              Delete Account?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will permanently delete your account and all associated data. This action cannot be undone. You will be logged out immediately.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteAccountConfirm(false)}
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
                onClick={confirmDeleteAccount}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--delete-button)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
                  border: '1px solid var(--delete-button)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout all sessions confirmation modal */}
      {showLogoutConfirm && (
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
              Log Out All Sessions?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              This will log you out of all devices and browsers, including this one. You will need to log in again.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
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
                  setShowLogoutConfirm(false);
                  handleLogoutAllSessions();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--delete-button)',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
                  border: '1px solid var(--delete-button)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)'
                }}
              >
                Log Out All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
