'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [exportMessage, setExportMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dueSoonInputRef = useRef<HTMLInputElement>(null);

  const { settings, updateSettings, exportData, importData, deleteAllData, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setDueSoonDays(settings.dueSoonWindowDays);
    setMounted(true);
  }, [settings, initializeStore]);

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
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
        setImportMessage('✓ Data imported successfully!');
        setTimeout(() => setImportMessage(''), 3000);
      } catch (error) {
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

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your experience" />
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: '24px' }}>
        {!session && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px', marginBottom: '24px', color: '#856404', fontSize: '14px' }}>
            ⚠️ You are not logged in. Settings will be saved to your browser only.
          </div>
        )}
        <div className="w-full grid grid-cols-1 gap-[var(--grid-gap)]">
          {/* Due Soon Window */}
          <Card title="Appearance">
            <div className="space-y-5">
              <div>
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
                <Button size="lg" onClick={handleDeleteAllData} style={{ paddingLeft: '24px', paddingRight: '24px', backgroundColor: '#660000', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                  <Trash2 size={18} />
                  Delete All Data
                </Button>
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
                <p className="font-semibold text-[var(--text)]">BYU Survival Tool</p>
                <p className="text-[var(--text-muted)]">v1.0</p>
              </div>
              <p className="text-[var(--text-secondary)]">
                A personal, privacy-first dashboard for BYU students to manage courses, deadlines, and tasks.
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
    </>
  );
}
