'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Upload, Trash2 } from 'lucide-react';

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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequest[]>([]);
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [university, setUniversity] = useState<string | null>(null);
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeRequestMessage, setCollegeRequestMessage] = useState('');
  const [collegeRequestLoading, setCollegeRequestLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dueSoonInputRef = useRef<HTMLInputElement>(null);

  const { settings, updateSettings, exportData, importData, deleteAllData } = useAppStore();

  useEffect(() => {
    // Store is already initialized globally by AppLoader
    setDueSoonDays(settings.dueSoonWindowDays);
    setUniversity(settings.university || null);
    setMounted(true);
  }, [settings.dueSoonWindowDays, settings.university]);

  // Fetch college requests if user is admin
  useEffect(() => {
    if (!mounted || !session?.user?.id) return;

    const fetchAdminData = async () => {
      try {
        const response = await fetch('/api/admin/college-requests');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(true);
          setCollegeRequests(data.requests);
        } else if (response.status === 403) {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to fetch college requests:', error);
      }
    };

    fetchAdminData();
  }, [mounted, session?.user?.id]);

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

  const handleExport = () => {
    const data = exportData();
    const filename = `byu-survival-tool-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportMessage('Data exported successfully');
    setTimeout(() => setExportMessage(''), 3000);
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
        setImportMessage('✗ Failed to import data. Invalid file format.');
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
      setDeleteMessage('✗ Failed to delete data');
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
      setDeleteMessage('✗ Failed to delete account');
      setTimeout(() => setDeleteMessage(''), 3000);
      setShowDeleteAccountConfirm(false);
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
        const errorText = data.details ? `${data.error} - ${data.details}` : (data.error || 'Failed to submit request');
        setCollegeRequestMessage(`✗ ${errorText}`);
        setCollegeRequestLoading(false);
        setTimeout(() => setCollegeRequestMessage(''), 5000);
        console.error('College request error:', data);
        return;
      }

      setCollegeRequestMessage('✓ ' + data.message);
      setCollegeRequestName('');
      setCollegeRequestLoading(false);
      setTimeout(() => setCollegeRequestMessage(''), 3000);
    } catch (error) {
      setCollegeRequestMessage('✗ Failed to submit request');
      setCollegeRequestLoading(false);
      setTimeout(() => setCollegeRequestMessage(''), 3000);
    }
  };

  const handleMarkAsAdded = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/college-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'added' }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to mark as added:', data);
        alert(`Failed to mark as added: ${data.error || 'Unknown error'}`);
        return;
      }

      setCollegeRequests(collegeRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error marking as added:', error);
      alert(`Error marking as added: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const data = await response.json();
        console.error('Failed to reject request:', data);
        alert(`Failed to reject request: ${data.error || 'Unknown error'}`);
        setShowDeleteRequestConfirm(false);
        return;
      }

      setCollegeRequests(collegeRequests.filter(req => req.id !== deleteRequestId));
      setShowDeleteRequestConfirm(false);
      setDeleteRequestId(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Error rejecting request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteRequestConfirm(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your experience" />
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: 'clamp(12px, 4%, 24px)' }}>
        {/* College Requests Card (Admin Only) */}
        {isAdmin && (
          <div style={{ marginBottom: '24px' }}>
            <Card title="College Requests">
              {collegeRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No pending requests</p>
              ) : (
                <div className="space-y-3">
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
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                        {request.collegeName}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Requested by {request.user.name || request.user.email} • Status: {request.status}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {request.status !== 'added' && (
                        <button
                          onClick={() => handleMarkAsAdded(request.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '14px',
                            backgroundColor: '#063d1d',
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
                          backgroundColor: '#660000',
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
            </Card>
          </div>
        )}

        {!session && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px', marginBottom: '24px', color: '#856404', fontSize: '14px' }}>
            ⚠️ You are not logged in. Settings will be saved to your browser only.
          </div>
        )}
        <div className="w-full grid grid-cols-1 gap-[var(--grid-gap)]">
          {/* University & Due Soon Window */}
          <Card title="Appearance">
            <div className="space-y-5">
              {/* University Picker */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  University
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Select your university to customize the app
                </p>
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
                    padding: '10px 12px 10px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                >
                  <option value="">Select a College</option>
                  <option value="Brigham Young University">Brigham Young University</option>
                  <option value="Brigham Young University Hawaii">Brigham Young University Hawaii</option>
                  <option value="Brigham Young University Idaho">Brigham Young University Idaho</option>
                  <option value="UNC Chapel Hill">UNC Chapel Hill</option>
                  <option value="Utah State University">Utah State University</option>
                  <option value="Utah Valley University">Utah Valley University</option>
                </select>
              </div>

              {/* Request a College */}
              <div style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Request a College
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Don't see your college? Request it to be added
                </p>
                <input
                  type="text"
                  value={collegeRequestName}
                  onChange={(e) => setCollegeRequestName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitCollegeRequest();
                    }
                  }}
                  placeholder="Enter college name"
                  maxLength={100}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    marginBottom: '12px'
                  }}
                  disabled={collegeRequestLoading}
                />
                <Button
                  size="lg"
                  onClick={handleSubmitCollegeRequest}
                  disabled={collegeRequestLoading}
                  style={{
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    backgroundColor: '#132343',
                    color: 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    opacity: collegeRequestLoading ? 0.6 : 1
                  }}
                >
                  {collegeRequestLoading ? 'Submitting...' : 'Request College'}
                </Button>
                {collegeRequestMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: collegeRequestMessage.includes('✗') ? 'var(--danger)' : 'var(--success)' }}>{collegeRequestMessage}</p>
                )}
              </div>

              {/* Due Soon Window */}
              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Due Soon Window
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Show deadlines within this many days
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
                      width: '96px',
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>days</span>
                </div>
                <Button size="lg" onClick={async () => {
                  const inputValue = dueSoonInputRef.current?.value || '';
                  const val = parseInt(inputValue);
                  if (!inputValue) {
                    setSaveMessage('Please enter a value');
                    setTimeout(() => setSaveMessage(''), 3000);
                    return;
                  }
                  if (!isNaN(val) && val >= 1 && val <= 30) {
                    try {
                      await updateSettings({ dueSoonWindowDays: val });
                      setSaveMessage('Saved successfully!');
                      setTimeout(() => setSaveMessage(''), 3000);
                    } catch (error) {
                      setSaveMessage('Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      setTimeout(() => setSaveMessage(''), 3000);
                    }
                  } else {
                    setSaveMessage('Please enter a number between 1 and 30');
                    setTimeout(() => setSaveMessage(''), 3000);
                  }
                }} style={{ marginTop: '16px', paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#132343', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                  Save
                </Button>
                {saveMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: saveMessage.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{saveMessage}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card title="Data & Backup">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>
                  Export your data
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Download a backup of all your data as a JSON file
                </p>
                <Button size="lg" onClick={handleExport} style={{ marginBottom: '16px', paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#132343', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                  <Download size={18} />
                  Export Data
                </Button>
                {exportMessage && (
                  <p className="text-sm text-[var(--success)]" style={{ marginTop: '8px' }}>{exportMessage}</p>
                )}
              </div>

              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px' }}>
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
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={18} />
                  Import Data
                </Button>
                {importMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: importMessage.includes('✓') ? 'var(--success)' : 'var(--danger)' }}>{importMessage}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Privacy & Danger Zone */}
          <Card title="Privacy">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Your data is stored securely on our servers and associated with your account. We do not share your personal information with third parties or use it for marketing purposes. All data is private to your account.
                </p>
              </div>
              <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px' }}>
                <label className="block text-sm font-medium text-[var(--danger)]" style={{ marginBottom: '8px' }}>
                  Danger Zone
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button size="lg" onClick={handleDeleteAllData} style={{ paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#660000', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                    <Trash2 size={18} />
                    Delete All Data
                  </Button>
                  <Button size="lg" onClick={handleDeleteAccount} style={{ paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#660000', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
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

          {/* About */}
          <Card title="About">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-[var(--text)]">College Survival Tool</p>
                <p className="text-[var(--text-muted)]">v1.0</p>
              </div>
              <p className="text-[var(--text-secondary)]">
                A personal, privacy-first dashboard for students to manage courses, deadlines, and tasks.
              </p>
              <p className="text-[var(--text-muted)] text-xs">
                All data is stored locally. No tracking, no ads, no third-party analytics.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete confirmation modal */}
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
                  backgroundColor: '#660000',
                  color: 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
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
                  backgroundColor: '#660000',
                  color: 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Delete Account
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
                  color: 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
