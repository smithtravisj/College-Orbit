'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DASHBOARD_CARDS, TOOLS_CARDS, CARD_LABELS, PAGES, DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [examReminders, setExamReminders] = useState<Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>>([]);
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeRequestMessage, setCollegeRequestMessage] = useState('');
  const [collegeRequestLoading, setCollegeRequestLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueReportMessage, setIssueReportMessage] = useState('');
  const [issueReportLoading, setIssueReportLoading] = useState(false);
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureRequestMessage, setFeatureRequestMessage] = useState('');
  const [featureRequestLoading, setFeatureRequestLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const dueSoonInputRef = useRef<HTMLInputElement>(null);

  // Visibility customization state
  const [activeCustomizationTab, setActiveCustomizationTab] = useState<'pages' | 'dashboard' | 'tools'>('pages');
  const [visiblePages, setVisiblePages] = useState<string[]>(DEFAULT_VISIBLE_PAGES);
  const [visibleDashboardCards, setVisibleDashboardCards] = useState<string[]>(DEFAULT_VISIBLE_DASHBOARD_CARDS);
  const [visibleToolsCards, setVisibleToolsCards] = useState<string[]>(DEFAULT_VISIBLE_TOOLS_CARDS);
  const [toolsCardsOrder, setToolsCardsOrder] = useState<string[]>(Object.values(TOOLS_CARDS));
  const [visiblePagesOrder, setVisiblePagesOrder] = useState<string[]>(Object.values(PAGES).filter(p => p !== 'Settings'));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [visibilityMessage, setVisibilityMessage] = useState('');
  const [isMacDesktop, setIsMacDesktop] = useState(false);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailExamReminders, setEmailExamReminders] = useState(true);
  const [emailAccountAlerts, setEmailAccountAlerts] = useState(true);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyExamReminders, setNotifyExamReminders] = useState(true);
  const [notifyAccountAlerts, setNotifyAccountAlerts] = useState(true);

  const { settings, updateSettings } = useAppStore();
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

  // Check if running on Mac desktop browser
  useEffect(() => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setIsMacDesktop(isMac);
  }, []);

  useEffect(() => {
    // Store is already initialized globally by AppLoader
    setDueSoonDays(settings.dueSoonWindowDays);
    setUniversity(settings.university || null);
    setSelectedTheme(settings.theme || 'dark');
    // Merge saved visible pages with any new pages added to defaults
    // Migrate "Deadlines" to "Assignments"
    const savedVisiblePages = (settings.visiblePages || []).map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
    const mergedVisiblePages = savedVisiblePages.length > 0
      ? [...new Set([...savedVisiblePages, ...DEFAULT_VISIBLE_PAGES.filter(p => !savedVisiblePages.includes(p))])]
      : DEFAULT_VISIBLE_PAGES;
    setVisiblePages(mergedVisiblePages);
    setVisibleDashboardCards(settings.visibleDashboardCards || DEFAULT_VISIBLE_DASHBOARD_CARDS);
    setVisibleToolsCards(settings.visibleToolsCards || DEFAULT_VISIBLE_TOOLS_CARDS);

    // Load tools cards order from settings
    if (settings.toolsCardsOrder) {
      const order = typeof settings.toolsCardsOrder === 'string'
        ? JSON.parse(settings.toolsCardsOrder)
        : settings.toolsCardsOrder;
      setToolsCardsOrder(order);
    } else {
      setToolsCardsOrder(Object.values(TOOLS_CARDS));
    }

    // Load pages order from settings
    if (settings.visiblePagesOrder) {
      const order = typeof settings.visiblePagesOrder === 'string'
        ? JSON.parse(settings.visiblePagesOrder)
        : settings.visiblePagesOrder;
      // Migrate "Deadlines" to "Assignments"
      const migratedOrder = order.map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
      // Add any new pages that aren't in the saved order (excluding Settings)
      const allPages = Object.values(PAGES).filter(p => p !== 'Settings');
      const newPages = allPages.filter(p => !migratedOrder.includes(p));
      setVisiblePagesOrder([...migratedOrder, ...newPages]);
    } else {
      setVisiblePagesOrder(Object.values(PAGES).filter(p => p !== 'Settings'));
    }

    // Load exam reminders from settings
    if (settings.examReminders) {
      try {
        const parsed = typeof settings.examReminders === 'string'
          ? JSON.parse(settings.examReminders)
          : settings.examReminders;
        // Convert old format (hours) to new format (value + unit) if needed
        const converted = Array.isArray(parsed) ? parsed.map((r: any) => {
          if ('value' in r && 'unit' in r) {
            return r;
          }
          // Old format with hours field
          const hours = r.hours || 0;
          if (hours === 168) return { enabled: r.enabled, value: 7, unit: 'days' };
          if (hours === 24) return { enabled: r.enabled, value: 1, unit: 'days' };
          if (hours === 3) return { enabled: r.enabled, value: 3, unit: 'hours' };
          // Convert arbitrary hours to days or hours
          if (hours >= 24) return { enabled: r.enabled, value: Math.round(hours / 24), unit: 'days' };
          return { enabled: r.enabled, value: hours, unit: 'hours' };
        }) : [];
        setExamReminders(converted);
      } catch {
        setExamReminders([]);
      }
    } else {
      // Default reminders: 7 days, 1 day, 3 hours
      setExamReminders([
        { enabled: true, value: 7, unit: 'days' },   // 7 days
        { enabled: true, value: 1, unit: 'days' },   // 1 day
        { enabled: true, value: 3, unit: 'hours' }   // 3 hours
      ]);
    }

    // Load email preferences
    setEmailAnnouncements(settings.emailAnnouncements !== false);
    setEmailExamReminders(settings.emailExamReminders !== false);
    setEmailAccountAlerts(settings.emailAccountAlerts !== false);

    // Load in-app notification preferences
    setNotifyAnnouncements(settings.notifyAnnouncements !== false);
    setNotifyExamReminders(settings.notifyExamReminders !== false);
    setNotifyAccountAlerts(settings.notifyAccountAlerts !== false);

    setMounted(true);
  }, [settings]);

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
        const errorText = data.error || 'We couldn\'t save your college request. Please try again.';
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
      setCollegeRequestMessage('✗ We couldn\'t save your college request. Please try again.');
      setCollegeRequestLoading(false);
      setTimeout(() => setCollegeRequestMessage(''), 3000);
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
        setIssueReportMessage('✗ We encountered a problem saving your report. Please try again.');
        setIssueReportLoading(false);
        setTimeout(() => setIssueReportMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.error || 'We couldn\'t save your report. Please try again.';
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
      setIssueReportMessage('✗ We couldn\'t save your report. Please try again.');
      setIssueReportLoading(false);
      setTimeout(() => setIssueReportMessage(''), 3000);
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
        setFeatureRequestMessage('✗ We encountered a problem saving your request. Please try again.');
        setFeatureRequestLoading(false);
        setTimeout(() => setFeatureRequestMessage(''), 5000);
        return;
      }

      if (!response.ok) {
        const errorText = data.error || 'We couldn\'t save your request. Please try again.';
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
      setFeatureRequestMessage('✗ We couldn\'t save your request. Please try again.');
      setFeatureRequestLoading(false);
      setTimeout(() => setFeatureRequestMessage(''), 3000);
    }
  };

  // Theme-specific colors for remove buttons
  const isDarkMode = selectedTheme === 'dark' || selectedTheme === 'system';
  const removeButtonColor = isDarkMode ? '#660000' : '#e63946';

  return (
    <>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      {/* Settings Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Subtle glow behind title */}
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
              Settings
            </h1>
          </div>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Customize your experience.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        {/* Desktop App - Hidden for now, uncomment when ready to release */}
        {false && isMacDesktop && (
          <div style={{ marginBottom: '24px' }}>
            <Card title="Desktop App">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <p className="text-sm text-[var(--text-muted)]" style={{ margin: 0, maxWidth: '600px' }}>
                    Download the native Mac app for a better desktop experience. The app runs in its own window without browser tabs or address bar.
                  </p>
                  <a
                    href="/downloads/College-Orbit.zip"
                    download
                    className="inline-flex items-center gap-2 font-medium text-sm transition-all duration-150"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'var(--accent)',
                      color: selectedTheme === 'light' ? '#000000' : 'white',
                      borderRadius: 'var(--radius-control)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Monitor size={18} />
                    Download Mac App
                  </a>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-control)',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--text-muted)'
                }}>
                  <strong style={{ color: 'var(--text)' }}>First time opening?</strong> After unzipping, drag the app to Applications. If macOS blocks it, go to <strong>System Settings → Privacy &amp; Security</strong> and click &quot;Open Anyway&quot; next to the blocked app message.
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="w-full" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? '14px' : 'var(--grid-gap)' }}>
          {!session && (
            <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px', marginBottom: '0px', color: '#856404', fontSize: '14px' }}>
              ⚠️ You are not logged in. Settings will be saved to your browser only.
            </div>
          )}
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
                  <option value="">Select a University</option>
                  <option value="Arizona State University">Arizona State University</option>
                  <option value="Brigham Young University">Brigham Young University</option>
                  <option value="Brigham Young University Hawaii">Brigham Young University Hawaii</option>
                  <option value="Brigham Young University Idaho">Brigham Young University Idaho</option>
                  <option value="North Lincoln High School">North Lincoln High School</option>
                  <option value="Ohio State University">Ohio State University</option>
                  <option value="UNC Chapel Hill">UNC Chapel Hill</option>
                  <option value="University of Central Florida">University of Central Florida</option>
                  <option value="University of Texas at Austin">University of Texas at Austin</option>
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
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleSubmitCollegeRequest}
                  disabled={collegeRequestLoading}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
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
                <Button size={isMobile ? 'sm' : 'lg'} onClick={async () => {
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
                }} style={{ marginTop: '16px', paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px', backgroundColor: 'var(--button-secondary)', color: settings.theme === 'light' ? '#000000' : 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                  Save
                </Button>
                {saveMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: saveMessage.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{saveMessage}</p>
                )}
              </div>

              {/* Exam Reminders - Hidden for now */}
              {false && <div className="border-t border-[var(--border)]" style={{ paddingTop: '16px', marginTop: '16px' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Exam Reminders
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Set when you want to receive study reminders before exams
                </p>
                <div className="space-y-3" style={{ marginBottom: '16px' }}>
                  {examReminders.map((reminder, idx) => {
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: isMobile ? '24px 1fr auto' : '24px 1fr auto', gap: isMobile ? '8px' : '12px', alignItems: isMobile ? 'start' : 'start', padding: isMobile ? '10px' : '12px', backgroundColor: 'var(--panel-2)', borderRadius: '6px' }}>
                        <input
                          type="checkbox"
                          checked={reminder.enabled}
                          onChange={(e) => {
                            const newReminders = [...examReminders];
                            newReminders[idx].enabled = e.target.checked;
                            setExamReminders(newReminders);
                            updateSettings({ examReminders: newReminders });
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            marginTop: '2px',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={reminder.value === 0 ? '' : reminder.value}
                            onChange={(e) => {
                              const newReminders = [...examReminders];
                              const val = e.target.value.trim();
                              if (val === '') {
                                // If field is cleared, disable the reminder
                                newReminders[idx].enabled = false;
                                newReminders[idx].value = 1; // Reset to default
                              } else {
                                const num = parseInt(val);
                                if (!isNaN(num) && num > 0) {
                                  newReminders[idx].value = num;
                                }
                              }
                              setExamReminders(newReminders);
                              updateSettings({ examReminders: newReminders });
                            }}
                            style={{
                              width: isMobile ? '40px' : '60px',
                              height: isMobile ? '28px' : '32px',
                              padding: '6px 8px',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              boxSizing: 'border-box',
                            }}
                          />
                          <select
                            value={reminder.unit}
                            onChange={(e) => {
                              const newReminders = [...examReminders];
                              newReminders[idx].unit = e.target.value as 'hours' | 'days';
                              setExamReminders(newReminders);
                              updateSettings({ examReminders: newReminders });
                            }}
                            style={{
                              height: isMobile ? '28px' : '32px',
                              padding: '6px 8px',
                              fontSize: isMobile ? '12px' : '14px',
                              backgroundColor: 'var(--panel)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                          <span style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-muted)' }}>
                            before
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const newReminders = examReminders.filter((_, i) => i !== idx);
                            setExamReminders(newReminders);
                            updateSettings({ examReminders: newReminders });
                          }}
                          style={{
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            fontSize: isMobile ? '11px' : '12px',
                            backgroundColor: removeButtonColor,
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            height: isMobile ? '28px' : '32px',
                            display: 'flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 0 10px rgba(220, 38, 38, 0.35)',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const newReminders = [...examReminders, { enabled: true, value: 1, unit: 'days' as const }];
                    setExamReminders(newReminders);
                    updateSettings({ examReminders: newReminders });
                  }}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                  }}
                >
                  + Add Reminder
                </Button>
              </div>}
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card title="Notification Preferences">
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
              Email Notifications
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Choose which emails you want to receive from College Orbit.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Announcements</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Updates and news from College Orbit</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAnnouncements}
                  onChange={async (e) => {
                    setEmailAnnouncements(e.target.checked);
                    await updateSettings({ emailAnnouncements: e.target.checked });
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Exam Reminders</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before your upcoming exams</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailExamReminders}
                  onChange={async (e) => {
                    setEmailExamReminders(e.target.checked);
                    await updateSettings({ emailExamReminders: e.target.checked });
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Account Alerts</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Password changes, subscription updates, and security alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAccountAlerts}
                  onChange={async (e) => {
                    setEmailAccountAlerts(e.target.checked);
                    await updateSettings({ emailAccountAlerts: e.target.checked });
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                />
              </label>
            </div>

            {/* In-App Notification Preferences */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                In-App Notifications
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Choose which in-app notifications you want to receive.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Announcements</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Updates and news from College Orbit</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAnnouncements}
                    onChange={async (e) => {
                      setNotifyAnnouncements(e.target.checked);
                      await updateSettings({ notifyAnnouncements: e.target.checked });
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Exam Reminders</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Reminders before your upcoming exams</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyExamReminders}
                    onChange={async (e) => {
                      setNotifyExamReminders(e.target.checked);
                      await updateSettings({ notifyExamReminders: e.target.checked });
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', margin: 0 }}>Account Alerts</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Subscription updates, payment alerts, and security notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAccountAlerts}
                    onChange={async (e) => {
                      setNotifyAccountAlerts(e.target.checked);
                      await updateSettings({ notifyAccountAlerts: e.target.checked });
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colorPalette.accent }}
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Page & Card Visibility */}
          <Card title="Page & Card Visibility">
            {/* Tab selector for customization sections */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
            }}>
              {[
                { id: 'pages', label: 'Pages' },
                { id: 'dashboard', label: 'Dashboard Cards' },
                ...(isMobile ? [] : [{ id: 'tools', label: 'Tools Cards' }]),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCustomizationTab(tab.id as 'pages' | 'dashboard' | 'tools')}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    activeCustomizationTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeCustomizationTab === tab.id ? 'var(--nav-active)' : 'transparent',
                    backgroundImage: activeCustomizationTab === tab.id ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                    boxShadow: activeCustomizationTab === tab.id ? `0 0 10px ${colorPalette.accent}80` : undefined,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pages Customization */}
            {activeCustomizationTab === 'pages' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Drag to reorder pages or uncheck to hide them from navigation
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {visiblePagesOrder.map((page, index) => {
                    const isDragging = draggingIndex === index;
                    const showDropLine = draggingIndex !== null && dragOverIndex === index && draggingIndex !== index;

                    return (
                      <div key={page} style={{ position: 'relative' }}>
                        {/* Drop line indicator - positioned absolutely so it doesn't shift items */}
                        {showDropLine && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              left: 0,
                              right: 0,
                              height: '3px',
                              backgroundColor: 'var(--accent)',
                              borderRadius: '1px',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <div
                          data-page={page}
                          draggable
                          onDragStart={(e) => {
                            setDraggingIndex(index);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', index.toString());
                            const dragElement = e.currentTarget as HTMLElement;
                            dragElement.style.opacity = '0.5';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';

                            const dragElement = e.currentTarget as HTMLElement;
                            const rect = dragElement.getBoundingClientRect();
                            const midpoint = rect.top + rect.height / 2;

                            // Only update dragOverIndex when crossing the clear midpoint line
                            const targetIndex = e.clientY < midpoint ? index : index + 1;
                            if (dragOverIndex !== targetIndex) {
                              setDragOverIndex(targetIndex);
                            }
                          }}
                          onDragLeave={(e) => {
                            const dragElement = e.currentTarget as HTMLElement;
                            if (e.clientX < dragElement.getBoundingClientRect().left ||
                                e.clientX > dragElement.getBoundingClientRect().right ||
                                e.clientY < dragElement.getBoundingClientRect().top ||
                                e.clientY > dragElement.getBoundingClientRect().bottom) {
                              setDragOverIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

                            if (draggedIndex !== dragOverIndex && dragOverIndex !== null) {
                              const newOrder = [...visiblePagesOrder];
                              const [draggedItem] = newOrder.splice(draggedIndex, 1);
                              // Adjust insertion index if dragging downward (draggedIndex < dragOverIndex)
                              const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                              newOrder.splice(insertIndex, 0, draggedItem);
                              setVisiblePagesOrder(newOrder);
                            }
                            setDraggingIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDragEnd={(e) => {
                            const dragElement = e.currentTarget as HTMLElement;
                            dragElement.style.opacity = '1';
                            setDraggingIndex(null);
                            setDragOverIndex(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.05)' : 'var(--panel-2)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            transition: 'all 0.15s ease-out',
                            opacity: isDragging ? 0.5 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={visiblePages.includes(page)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisiblePages([...visiblePages, page]);
                              } else {
                                setVisiblePages(visiblePages.filter((p) => p !== page));
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1 }}>
                            {page}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>
                            ⋮⋮
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dashboard Cards Customization */}
            {activeCustomizationTab === 'dashboard' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Choose which cards appear on the Dashboard
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.values(DASHBOARD_CARDS).map((cardId) => (
                    <label
                      key={cardId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleDashboardCards.includes(cardId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibleDashboardCards([...visibleDashboardCards, cardId]);
                          } else {
                            setVisibleDashboardCards(visibleDashboardCards.filter((c) => c !== cardId));
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--text)', fontSize: '14px' }}>
                        {CARD_LABELS[cardId] || cardId}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Cards Customization */}
            {activeCustomizationTab === 'tools' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Drag to reorder cards or uncheck to hide them from the Tools page
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {toolsCardsOrder.map((cardId, index) => {
                    const isDragging = draggingIndex === index;
                    const showDropLine = draggingIndex !== null && dragOverIndex === index && draggingIndex !== index;

                    return (
                      <div key={cardId} style={{ position: 'relative' }}>
                        {/* Drop line indicator - positioned absolutely so it doesn't shift items */}
                        {showDropLine && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              left: 0,
                              right: 0,
                              height: '3px',
                              backgroundColor: 'var(--accent)',
                              borderRadius: '1px',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <div
                          data-card-id={cardId}
                          draggable
                          onDragStart={(e) => {
                            setDraggingIndex(index);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', index.toString());
                            const dragElement = e.currentTarget as HTMLElement;
                            dragElement.style.opacity = '0.5';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';

                            const dragElement = e.currentTarget as HTMLElement;
                            const rect = dragElement.getBoundingClientRect();
                            const midpoint = rect.top + rect.height / 2;

                            // Only update dragOverIndex when crossing the clear midpoint line
                            const targetIndex = e.clientY < midpoint ? index : index + 1;
                            if (dragOverIndex !== targetIndex) {
                              setDragOverIndex(targetIndex);
                            }
                          }}
                          onDragLeave={(e) => {
                            const dragElement = e.currentTarget as HTMLElement;
                            if (e.clientX < dragElement.getBoundingClientRect().left ||
                                e.clientX > dragElement.getBoundingClientRect().right ||
                                e.clientY < dragElement.getBoundingClientRect().top ||
                                e.clientY > dragElement.getBoundingClientRect().bottom) {
                              setDragOverIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

                            if (draggedIndex !== dragOverIndex && dragOverIndex !== null) {
                              const newOrder = [...toolsCardsOrder];
                              const [draggedItem] = newOrder.splice(draggedIndex, 1);
                              // Adjust insertion index if dragging downward (draggedIndex < dragOverIndex)
                              const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                              newOrder.splice(insertIndex, 0, draggedItem);
                              setToolsCardsOrder(newOrder);
                            }
                            setDraggingIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDragEnd={(e) => {
                            const dragElement = e.currentTarget as HTMLElement;
                            dragElement.style.opacity = '1';
                            setDraggingIndex(null);
                            setDragOverIndex(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.05)' : 'var(--panel-2)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            transition: 'all 0.2s ease-out',
                            opacity: isDragging ? 0.5 : 1,
                          }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleToolsCards.includes(cardId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleToolsCards([...visibleToolsCards, cardId]);
                            } else {
                              setVisibleToolsCards(visibleToolsCards.filter((c) => c !== cardId));
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '13px', flex: 1 }}>
                          {CARD_LABELS[cardId] || cardId}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>
                          ⋮⋮
                        </span>
                      </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              size={isMobile ? 'sm' : 'lg'}
              onClick={async () => {
                try {
                  await updateSettings({
                    visiblePages,
                    visibleDashboardCards,
                    visibleToolsCards,
                    toolsCardsOrder,
                    visiblePagesOrder,
                  });
                  setVisibilityMessage('Saved successfully!');
                  setTimeout(() => setVisibilityMessage(''), 3000);
                } catch (error) {
                  setVisibilityMessage('Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  setTimeout(() => setVisibilityMessage(''), 3000);
                }
              }}
              style={{
                marginTop: '24px',
                paddingLeft: isMobile ? '12px' : '16px',
                paddingRight: isMobile ? '12px' : '16px',
                backgroundColor: 'var(--button-secondary)',
                color: settings.theme === 'light' ? '#000000' : 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
              }}
            >
              Save Visibility Settings
            </Button>
            {visibilityMessage && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: visibilityMessage.includes('Error') ? 'var(--danger)' : 'var(--success)',
                }}
              >
                {visibilityMessage}
              </p>
            )}
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
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleSubmitFeatureRequest}
                  disabled={featureRequestLoading}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
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
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={handleSubmitIssueReport}
                  disabled={issueReportLoading}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
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

          {/* About */}
          <Card title="About">
            <div className="space-y-4">
              <div className="space-y-3 text-sm border-b border-[var(--border)]" style={{ paddingBottom: '18px' }}>
                <div>
                  <p className="font-semibold text-[var(--text)]">College Orbit</p>
                  <p className="text-[var(--text-muted)]">v1.1</p>
                </div>
                <p className="text-[var(--text-secondary)]">
                  A personal, privacy-first dashboard for students to manage courses, deadlines, and tasks.
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  Your data is stored securely on our servers. We do not share your personal information with third parties.
                </p>
              </div>
              {/* Onboarding Tour */}
              <div style={{ paddingTop: '16px', paddingBottom: '22px', borderTop: '1px solid var(--border)' }}>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Onboarding Tour
                </label>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Replay the interactive tutorial to learn about app features
                </p>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  onClick={async () => {
                    try {
                      // Update settings through store (updates both local state and database)
                      await updateSettings({ hasCompletedOnboarding: false });

                      // Redirect to dashboard to start the tutorial
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Failed to restart tutorial:', error);
                    }
                  }}
                  style={{
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                  }}
                >
                  Restart Tutorial
                </Button>
              </div>
              {/* Contact Section */}
              <div style={{ paddingTop: '22px', paddingBottom: '6px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Contact
                </p>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Questions, feedback, or issues? Reach out anytime.
                </p>
                <button
                  onClick={() => setShowEmailConfirm(true)}
                  className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  collegeorbit@protonmail.com
                </button>
              </div>
              {/* Legal Section */}
              <div style={{ paddingTop: '22px', borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Legal
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Email confirmation modal */}
      {showEmailConfirm && (
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
              Open Email App?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
              This will open your default email app to send a message to:
            </p>
            <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
              collegeorbit@protonmail.com
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEmailConfirm(false)}
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
                  navigator.clipboard.writeText('collegeorbit@protonmail.com');
                  setShowEmailConfirm(false);
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
                Copy Email
              </button>
              <button
                onClick={() => {
                  window.location.href = 'mailto:collegeorbit@protonmail.com';
                  setShowEmailConfirm(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Open Email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
