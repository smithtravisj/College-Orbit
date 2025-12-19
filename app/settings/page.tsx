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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collegeRequests, setCollegeRequests] = useState<CollegeRequest[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [adminTab, setAdminTab] = useState<'college' | 'issues' | 'features'>('college');
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeRequestMessage, setCollegeRequestMessage] = useState('');
  const [collegeRequestLoading, setCollegeRequestLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueReportMessage, setIssueReportMessage] = useState('');
  const [issueReportLoading, setIssueReportLoading] = useState(false);
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureRequestMessage, setFeatureRequestMessage] = useState('');
  const [featureRequestLoading, setFeatureRequestLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [deleteFeatureId, setDeleteFeatureId] = useState<string | null>(null);
  const [showDeleteFeatureConfirm, setShowDeleteFeatureConfirm] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [showDeleteIssueConfirm, setShowDeleteIssueConfirm] = useState(false);
  const [deleteIssueId, setDeleteIssueId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dueSoonInputRef = useRef<HTMLInputElement>(null);

  const { settings, updateSettings, exportData, importData, deleteAllData } = useAppStore();

  useEffect(() => {
    // Store is already initialized globally by AppLoader
    setDueSoonDays(settings.dueSoonWindowDays);
    setUniversity(settings.university || null);
    setSelectedTheme(settings.theme || 'dark');
    setMounted(true);
  }, [settings.dueSoonWindowDays, settings.university, settings.theme]);

  // Fetch college requests and issue reports if user is admin
  useEffect(() => {
    if (!mounted || !session?.user?.id) return;

    const fetchAdminData = async () => {
      try {
        const collegeResponse = await fetch('/api/admin/college-requests');
        const issuesResponse = await fetch('/api/admin/issue-reports');
        const featuresResponse = await fetch('/api/admin/feature-requests');

        // If any endpoint returns 403, user is not admin
        if (collegeResponse.status === 403 || issuesResponse.status === 403 || featuresResponse.status === 403) {
          setIsAdmin(false);
          return;
        }

        // If we get here, user is likely an admin - set it to true
        setIsAdmin(true);

        // Load each data type independently so one failure doesn't prevent the card from showing
        if (collegeResponse.ok) {
          const collegeData = await collegeResponse.json();
          setCollegeRequests(collegeData.requests);
        }
        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          setIssueReports(issuesData.reports);
        }
        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json();
          setFeatureRequests(featuresData.requests);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      }
    };

    // Initial fetch
    fetchAdminData();

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(fetchAdminData, 5000);

    // Listen for notification refresh events to immediately update admin data
    const handleRefresh = () => {
      fetchAdminData();
    };

    window.addEventListener('notification-refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-refresh', handleRefresh);
    };
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

  const handleExport = async () => {
    try {
      const data = await exportData();
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
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('✗ Failed to export data');
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

      // Trigger notification refresh in the bell component
      window.dispatchEvent(new Event('notification-refresh'));

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
        setIssueReportMessage('✗ Server error - invalid response');
        setIssueReportLoading(false);
        setTimeout(() => setIssueReportMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.details ? `${data.error} - ${data.details}` : (data.error || 'Failed to submit report');
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
      setIssueReportMessage('✗ Failed to submit report');
      setIssueReportLoading(false);
      setTimeout(() => setIssueReportMessage(''), 3000);
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
        const data = await response.json();
        console.error('Failed to mark as fixed:', data);
        alert(`Failed to mark as fixed: ${data.error || 'Unknown error'}`);
        return;
      }

      setIssueReports(issueReports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error marking as fixed:', error);
      alert(`Error marking as fixed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const data = await response.json();
        console.error('Failed to reject report:', data);
        alert(`Failed to reject report: ${data.error || 'Unknown error'}`);
        setShowDeleteIssueConfirm(false);
        return;
      }

      setIssueReports(issueReports.filter(report => report.id !== deleteIssueId));
      setShowDeleteIssueConfirm(false);
      setDeleteIssueId(null);
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert(`Error rejecting report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteIssueConfirm(false);
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
        setFeatureRequestMessage('✗ Server error - invalid response');
        setFeatureRequestLoading(false);
        setTimeout(() => setFeatureRequestMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.details ? `${data.error} - ${data.details}` : (data.error || 'Failed to submit request');
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
      setFeatureRequestMessage('✗ Failed to submit request');
      setFeatureRequestLoading(false);
      setTimeout(() => setFeatureRequestMessage(''), 3000);
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
        const data = await response.json();
        console.error('Failed to mark as implemented:', data);
        alert(`Failed to mark as implemented: ${data.error || 'Unknown error'}`);
        return;
      }

      setFeatureRequests(featureRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error marking as implemented:', error);
      alert(`Error marking as implemented: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const data = await response.json();
        console.error('Failed to reject request:', data);
        alert(`Failed to reject request: ${data.error || 'Unknown error'}`);
        setShowDeleteFeatureConfirm(false);
        return;
      }

      setFeatureRequests(featureRequests.filter(request => request.id !== deleteFeatureId));
      setShowDeleteFeatureConfirm(false);
      setDeleteFeatureId(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Error rejecting request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteFeatureConfirm(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your experience" />
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: 'clamp(12px, 4%, 24px)' }}>
        {/* Admin Requests Card (Admin Only) */}
        {isAdmin && (
          <div style={{ marginBottom: '24px' }}>
            <Card title="Admin Requests">
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <button
                  onClick={() => setAdminTab('college')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: adminTab === 'college' ? '600' : '400',
                    color: adminTab === 'college' ? 'var(--text)' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: adminTab === 'college' ? '2px solid var(--text)' : 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    marginBottom: '-12px',
                    paddingBottom: '20px',
                  }}
                >
                  College Requests
                </button>
                <button
                  onClick={() => setAdminTab('issues')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: adminTab === 'issues' ? '600' : '400',
                    color: adminTab === 'issues' ? 'var(--text)' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: adminTab === 'issues' ? '2px solid var(--text)' : 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    marginBottom: '-12px',
                    paddingBottom: '20px',
                  }}
                >
                  Issue Reports
                </button>
                <button
                  onClick={() => setAdminTab('features')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: adminTab === 'features' ? '600' : '400',
                    color: adminTab === 'features' ? 'var(--text)' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: adminTab === 'features' ? '2px solid var(--text)' : 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    marginBottom: '-12px',
                    paddingBottom: '20px',
                  }}
                >
                  Feature Requests
                </button>
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
                                backgroundColor: selectedTheme === 'light' ? 'var(--success)' : '#063d1d',
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
                            Reported by {report.user.name || report.user.email} • Status: {report.status}
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
                            Requested by {request.user.name || request.user.email} • Status: {request.status}
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
              {/* Theme Selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)]"
                       style={{ marginBottom: '8px' }}>
                  Theme
                </label>
                <p className="text-sm text-[var(--text-muted)]"
                   style={{ marginBottom: '12px' }}>
                  Choose your preferred color scheme
                </p>
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
                        color: selectedTheme === themeOption
                          ? 'var(--text)'
                          : 'var(--text-muted)',
                        backgroundColor: selectedTheme === themeOption
                          ? 'var(--panel)'
                          : 'transparent',
                        border: selectedTheme === themeOption
                          ? '1px solid var(--border)'
                          : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTheme !== themeOption) {
                          e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTheme !== themeOption) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                borderTop: '1px solid var(--border)',
                marginTop: '24px',
                marginBottom: '24px'
              }} />

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
                    padding: '8px 12px 8px 12px',
                    fontSize: '16px',
                    lineHeight: '28px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '18px',
                    paddingRight: '36px'
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

              {/* Request a University */}
              <div style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Request a University
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Don't see your university? Request it to be added
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
                  placeholder="Enter university name"
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
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    opacity: collegeRequestLoading ? 0.6 : 1
                  }}
                >
                  {collegeRequestLoading ? 'Submitting...' : 'Request University'}
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
                }} style={{ marginTop: '16px', paddingLeft: '16px', paddingRight: '16px', backgroundColor: 'var(--button-secondary)', color: settings.theme === 'light' ? '#000000' : 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                  Save
                </Button>
                {saveMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: saveMessage.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{saveMessage}</p>
                )}
              </div>
            </div>
          </Card>

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
                    marginBottom: '8px',
                    resize: 'vertical',
                  }}
                  disabled={featureRequestLoading}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {featureDescription.length} / 1000 characters
                </p>
                <Button
                  size="lg"
                  onClick={handleSubmitFeatureRequest}
                  disabled={featureRequestLoading}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    opacity: featureRequestLoading ? 0.6 : 1,
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
                    marginBottom: '8px',
                    resize: 'vertical',
                  }}
                  disabled={issueReportLoading}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {issueDescription.length} / 1000 characters
                </p>
                <Button
                  size="lg"
                  onClick={handleSubmitIssueReport}
                  disabled={issueReportLoading}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    opacity: issueReportLoading ? 0.6 : 1
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
                <Button size="lg" onClick={handleExport} style={{ marginBottom: '16px', paddingLeft: '16px', paddingRight: '16px', backgroundColor: 'var(--button-secondary)', color: settings.theme === 'light' ? '#000000' : 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
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
                  <Button size="lg" onClick={handleDeleteAllData} style={{ paddingLeft: '16px', paddingRight: '16px', backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                    <Trash2 size={18} />
                    Delete All Data
                  </Button>
                  <Button size="lg" onClick={handleDeleteAccount} style={{ paddingLeft: '16px', paddingRight: '16px', backgroundColor: selectedTheme === 'light' ? 'var(--danger)' : '#660000', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
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
                  color: 'white',
                  border: '1px solid #660000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
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
                  color: 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--danger)' : '#660000'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
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
                  color: 'white',
                  border: `1px solid ${selectedTheme === 'light' ? 'var(--danger)' : '#660000'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
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
