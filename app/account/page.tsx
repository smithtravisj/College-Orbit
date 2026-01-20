'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Shield, Download, Upload, Trash2, Eye, EyeOff, Crown, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { exportData, importData, deleteAllData } = useAppStore();
  const subscription = useSubscription();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = { name, email };
      if (password) {
        updateData.password = password;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error || 'Failed to update account');
        setLoading(false);
        return;
      }

      setSuccess('Account updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);

      // Refresh the session to update user data
      await updateSession();

      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
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
      <div className="mx-auto w-full max-w-[1200px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
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
      <div className="mx-auto w-full max-w-[1200px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-[var(--grid-gap)]">
          <Card title="Account Information">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-500">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
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
                  <Download size={18} />
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
                  <Upload size={18} />
                  Import Data
                </Button>
                {importMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: importMessage.includes('✓') ? 'var(--success)' : 'var(--danger)' }}>{importMessage}</p>
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

          {/* Subscription */}
          <Card>
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
                        'Dashboard customization',
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
