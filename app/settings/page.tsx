'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [dueSoonDays, setDueSoonDays] = useState(7);
  const [exportMessage, setExportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings, updateSettings, exportData, importData, deleteAllData, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setDueSoonDays(settings.dueSoonWindowDays);
    setMounted(true);
  }, [settings, initializeStore]);

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
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = () => {
    if (confirm('Are you sure? This will delete ALL data (courses, tasks, deadlines). This cannot be undone.')) {
      deleteAllData();
      alert('All data deleted');
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your experience" />
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: '24px' }}>
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
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={dueSoonDays}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setDueSoonDays('');
                      } else {
                        const val = parseInt(inputValue);
                        if (!isNaN(val) && val >= 1 && val <= 30) {
                          setDueSoonDays(val);
                          updateSettings({ dueSoonWindowDays: val });
                        }
                      }
                    }}
                    onBlur={() => {
                      if (dueSoonDays === '' || isNaN(dueSoonDays as any)) {
                        setDueSoonDays(7);
                        updateSettings({ dueSoonWindowDays: 7 });
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">days</span>
                </div>
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
    </>
  );
}
