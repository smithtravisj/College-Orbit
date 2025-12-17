'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';

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
    return <div className="p-6">Loading...</div>;
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

    setExportMessage('✓ Data exported successfully');
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
    if (
      confirm(
        'Are you sure? This will delete ALL data (courses, tasks, deadlines). This cannot be undone.'
      )
    ) {
      deleteAllData();
      alert('All data deleted');
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Due Soon Window */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-4 text-lg font-semibold">Due Soon Window</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="30"
            value={dueSoonDays}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setDueSoonDays(val);
              updateSettings({ dueSoonWindowDays: val });
            }}
            className="w-20 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Show deadlines within this many days
          </span>
        </div>
      </div>

      {/* Data Import/Export */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-4 text-lg font-semibold">Data Backup</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="block w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Export Data (JSON)
          </button>
          {exportMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">{exportMessage}</p>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="block w-full rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Import Data (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-4 text-lg font-semibold">Privacy</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          This app stores all data locally on your device. No information is sent to external servers.
          You can delete all data at any time.
        </p>
        <button
          onClick={handleDeleteAllData}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete All Data
        </button>
      </div>

      {/* About */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-4 text-lg font-semibold">About</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>BYU Survival Tool</strong> v1.0
          </p>
          <p>
            A personal, privacy-first dashboard for BYU students.
          </p>
          <p>
            All data is stored locally. No tracking, no ads, no third-party analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
