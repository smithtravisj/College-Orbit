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
      <div className="mx-auto max-w-[768px] px-8 py-8 space-y-7">
          {/* Due Soon Window */}
          <Card title="Appearance" padding="lg">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Due Soon Window
                </label>
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  Show deadlines within this many days
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={dueSoonDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDueSoonDays(val);
                      updateSettings({ dueSoonWindowDays: val });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">days</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card title="Data & Backup" padding="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-3">
                  Export your data
                </label>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Download a backup of all your data as a JSON file
                </p>
                <Button variant="primary" onClick={handleExport}>
                  <Download size={18} />
                  Export Data
                </Button>
                {exportMessage && (
                  <p className="text-sm text-[var(--success)] mt-2">{exportMessage}</p>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-sm font-medium text-[var(--text)] mb-3">
                  Import your data
                </label>
                <p className="text-sm text-[var(--text-muted)] mb-4">
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
          <Card title="Privacy" padding="lg">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  This app stores all data locally on your device. No information is sent to external servers. You have complete control over your data.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-sm font-medium text-[var(--danger)] mb-2">
                  Danger Zone
                </label>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <Button variant="danger" onClick={handleDeleteAllData}>
                  <Trash2 size={18} />
                  Delete All Data
                </Button>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card title="About" padding="lg">
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
    </>
  );
}
