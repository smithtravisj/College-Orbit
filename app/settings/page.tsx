'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getDefaultCustomColors, getCustomColorSetForTheme, CustomColors, CustomColorSet } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import { Monitor } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DASHBOARD_CARDS, TOOLS_CARDS, CARD_LABELS, PAGES, DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { data: session, status: sessionStatus } = useSession();
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [dueSoonDays, setDueSoonDays] = useState<number | string>(7);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeRequestMessage, setCollegeRequestMessage] = useState('');
  const [collegeRequestLoading, setCollegeRequestLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueReportMessage, setIssueReportMessage] = useState('');
  const [issueReportLoading, setIssueReportLoading] = useState(false);
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureRequestMessage, setFeatureRequestMessage] = useState('');
  const [featureRequestLoading, setFeatureRequestLoading] = useState(false);
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

  // Custom theme and visual effects only apply for premium users
  const effectiveUseCustomTheme = isPremium && settings.useCustomTheme;
  const effectiveCustomColors = isPremium ? settings.customColors : null;
  const accentColor = effectiveUseCustomTheme && effectiveCustomColors
    ? getCustomColorSetForTheme(effectiveCustomColors as CustomColors, settings.theme || 'dark').accent
    : colorPalette.accent;
  const glowIntensity = isPremium ? (settings.glowIntensity ?? 50) : 50;
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');

  // Check if running on Mac desktop browser
  useEffect(() => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setIsMacDesktop(isMac);
  }, []);

  useEffect(() => {
    // Only run once on mount to initialize local state from store
    if (mounted) return;

    // Store is already initialized globally by AppLoader
    setDueSoonDays(settings.dueSoonWindowDays);
    setUniversity(settings.university || null);
    setSelectedTheme(settings.theme || 'dark');
    // Use saved visible pages directly - don't merge with defaults
    // as that would add back pages the user explicitly hid
    // Migrate "Deadlines" to "Assignments"
    const savedVisiblePages = (settings.visiblePages || []).map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
    setVisiblePages(savedVisiblePages.length > 0 ? savedVisiblePages : DEFAULT_VISIBLE_PAGES);
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

    // Load custom theme settings
    setUseCustomTheme(settings.useCustomTheme || false);
    if (settings.customColors) {
      setCustomColors(settings.customColors as CustomColors);
    } else {
      // Initialize with defaults based on university (includes both light and dark)
      setCustomColors(getDefaultCustomColors(settings.university));
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
  }, [settings, mounted]);

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
          {!session && sessionStatus !== 'loading' && (
            <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px', marginBottom: '0px', color: '#856404', fontSize: '14px' }}>
              ⚠️ You are not logged in. Settings will be saved to your browser only.
            </div>
          )}
          {/* General Settings */}
          <Card title="General">
            {/* Theme */}
            <div style={{ marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Theme</p>
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
                      color: selectedTheme === themeOption ? 'var(--text)' : 'var(--text-muted)',
                      backgroundColor: selectedTheme === themeOption ? 'var(--panel)' : 'transparent',
                      border: selectedTheme === themeOption ? '1px solid var(--border)' : '1px solid transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* University */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>University</p>
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
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${selectedTheme === 'light' ? '%23666666' : 'white'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '18px',
                  paddingRight: '36px',
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
              <div style={{ marginTop: '12px' }}>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>
                  Don't see yours? Request it to be added
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={collegeRequestName}
                    onChange={(e) => setCollegeRequestName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitCollegeRequest();
                      }
                    }}
                    placeholder="University name"
                    maxLength={100}
                    style={{
                      flex: 1,
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    disabled={collegeRequestLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitCollegeRequest}
                    disabled={collegeRequestLoading}
                    style={{
                      backgroundColor: 'var(--button-secondary)',
                      color: settings.theme === 'light' ? '#000000' : 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--border)',
                      opacity: collegeRequestLoading ? 0.6 : 1
                    }}
                  >
                    {collegeRequestLoading ? '...' : 'Request'}
                  </Button>
                </div>
                {collegeRequestMessage && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: collegeRequestMessage.includes('✗') ? 'var(--danger)' : 'var(--success)' }}>{collegeRequestMessage}</p>
                )}
              </div>
            </div>

            {/* Due Soon Window */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Due Soon Window</p>
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
                    width: '80px',
                    height: '40px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>days</span>
              </div>
            </div>
          </Card>

          {/* Appearance (Premium) - Custom Theme + Visual Effects */}
          <Card title="Appearance">
            {!isPremium && !isLoadingSubscription && (
              <div style={{ marginBottom: '16px' }}>
                <UpgradePrompt feature="Custom themes and visual effects" />
              </div>
            )}

            {/* Custom Theme Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Color Theme</p>
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                opacity: isPremium ? 1 : 0.5,
              }}>
                <button
                  onClick={() => {
                    if (!isPremium) return;
                    setUseCustomTheme(false);
                    updateSettings({ useCustomTheme: false });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: !effectiveUseCustomTheme ? 'var(--text)' : 'var(--text-muted)',
                    backgroundColor: !effectiveUseCustomTheme ? 'var(--panel)' : 'transparent',
                    border: !effectiveUseCustomTheme ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                >
                  College Theme
                </button>
                <button
                  onClick={() => {
                    if (!isPremium) return;
                    setUseCustomTheme(true);
                    const colors = customColors || getDefaultCustomColors(university);
                    setCustomColors(colors);
                    updateSettings({ useCustomTheme: true, customColors: colors });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: effectiveUseCustomTheme ? 'var(--text)' : 'var(--text-muted)',
                    backgroundColor: effectiveUseCustomTheme ? 'var(--panel)' : 'transparent',
                    border: effectiveUseCustomTheme ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                >
                  Custom Theme
                </button>
              </div>
            </div>

            {/* Color Pickers */}
            {isPremium && useCustomTheme && customColors && (() => {
              const currentThemeMode = selectedTheme === 'system'
                ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : selectedTheme;
              const currentColorSet = currentThemeMode === 'light' ? customColors.light : customColors.dark;

              const updateColor = (key: keyof CustomColorSet, value: string) => {
                const newColors = {
                  ...customColors,
                  [currentThemeMode]: { ...currentColorSet, [key]: value },
                };
                setCustomColors(newColors);
                updateSettings({ customColors: newColors });
              };

              return (
              <div style={{ marginBottom: '20px' }}>
                <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '12px' }}>
                  Editing colors for {currentThemeMode} mode
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                  <ColorPicker label="Primary" value={currentColorSet.accent} onChange={(color) => updateColor('accent', color)} />
                  <ColorPicker label="Links" value={currentColorSet.link} onChange={(color) => updateColor('link', color)} />
                  <ColorPicker label="Success" value={currentColorSet.success} onChange={(color) => updateColor('success', color)} />
                  <ColorPicker label="Warning" value={currentColorSet.warning} onChange={(color) => updateColor('warning', color)} />
                  <ColorPicker label="Danger" value={currentColorSet.danger} onChange={(color) => updateColor('danger', color)} />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const defaultColors = getDefaultCustomColors(university);
                    setCustomColors(defaultColors);
                    updateSettings({ customColors: defaultColors });
                  }}
                  style={{ marginTop: '12px', boxShadow: 'none' }}
                >
                  Reset Colors
                </Button>
              </div>
              );
            })()}

            {/* Visual Effects */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', opacity: isPremium ? 1 : 0.5 }}>
              <p className="text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>Visual Effects</p>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-sm text-[var(--text)]">Gradient Intensity</span>
                  <span className="text-sm text-[var(--text-muted)]">{settings.gradientIntensity ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.gradientIntensity ?? 50}
                  onChange={(e) => isPremium && updateSettings({ gradientIntensity: parseInt(e.target.value) })}
                  disabled={!isPremium}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${settings.gradientIntensity ?? 50}%, var(--border) ${settings.gradientIntensity ?? 50}%, var(--border) 100%)`,
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-sm text-[var(--text)]">Glow Intensity</span>
                  <span className="text-sm text-[var(--text-muted)]">{settings.glowIntensity ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.glowIntensity ?? 50}
                  onChange={(e) => isPremium && updateSettings({ glowIntensity: parseInt(e.target.value) })}
                  disabled={!isPremium}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${settings.glowIntensity ?? 50}%, var(--border) ${settings.glowIntensity ?? 50}%, var(--border) 100%)`,
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Page & Card Visibility */}
          <Card title="Page & Card Visibility">
            {/* Premium upgrade prompt */}
            {!isPremium && !isLoadingSubscription && (
              <div style={{ marginBottom: '16px' }}>
                <UpgradePrompt feature="Page & card visibility customization" />
              </div>
            )}

            {/* Tab selector for customization sections */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              opacity: isPremium ? 1 : 0.5,
              pointerEvents: isPremium ? 'auto' : 'none',
            }}>
              {[
                { id: 'pages', label: 'Pages' },
                { id: 'dashboard', label: 'Dashboard Cards' },
                ...(isMobile ? [] : [{ id: 'tools', label: 'Tools Cards' }]),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => isPremium && setActiveCustomizationTab(tab.id as 'pages' | 'dashboard' | 'tools')}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    activeCustomizationTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeCustomizationTab === tab.id ? 'var(--nav-active)' : 'transparent',
                    backgroundImage: activeCustomizationTab === tab.id ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                    boxShadow: activeCustomizationTab === tab.id ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                    border: 'none',
                    cursor: isPremium ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pages Customization */}
            {activeCustomizationTab === 'pages' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Drag to reorder pages or uncheck to hide them from navigation
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingIndex === null || dragOverIndex === null) return;
                    if (draggingIndex !== dragOverIndex) {
                      const newOrder = [...visiblePagesOrder];
                      const [draggedItem] = newOrder.splice(draggingIndex, 1);
                      const insertIndex = draggingIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                      newOrder.splice(insertIndex, 0, draggedItem);
                      setVisiblePagesOrder(newOrder);
                    }
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  {visiblePagesOrder.map((page, index) => {
                    const isDragging = draggingIndex === index;
                    // Calculate if this item should shift up or down
                    let translateY = 0;
                    if (draggingIndex !== null && dragOverIndex !== null && !isDragging) {
                      const itemHeight = 48; // Approximate height of each item including gap
                      if (draggingIndex < dragOverIndex) {
                        // Dragging downward: items between dragging and dragOver shift up
                        if (index > draggingIndex && index < dragOverIndex) {
                          translateY = -itemHeight;
                        }
                      } else if (draggingIndex > dragOverIndex) {
                        // Dragging upward: items between dragOver and dragging shift down
                        if (index >= dragOverIndex && index < draggingIndex) {
                          translateY = itemHeight;
                        }
                      }
                    }

                    return (
                      <div
                        key={page}
                        data-page={page}
                        draggable
                        onDragStart={(e) => {
                          setDragOverIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', index.toString());

                          // Create custom drag image with glow effect
                          const dragEl = e.currentTarget.cloneNode(true) as HTMLElement;
                          dragEl.style.backgroundColor = 'var(--accent-2)';
                          dragEl.style.border = '1px solid var(--accent)';
                          dragEl.style.boxShadow = '0 0 12px var(--accent)';
                          dragEl.style.opacity = '0.9';
                          dragEl.style.transform = 'scale(1.02)';
                          dragEl.style.position = 'absolute';
                          dragEl.style.top = '-9999px';
                          dragEl.style.width = `${e.currentTarget.offsetWidth}px`;
                          document.body.appendChild(dragEl);
                          e.dataTransfer.setDragImage(dragEl, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          requestAnimationFrame(() => {
                            document.body.removeChild(dragEl);
                            setDraggingIndex(index);
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';

                          const rect = e.currentTarget.getBoundingClientRect();
                          const midpoint = rect.top + rect.height / 2;
                          const targetIndex = e.clientY < midpoint ? index : index + 1;

                          if (dragOverIndex !== targetIndex) {
                            setDragOverIndex(targetIndex);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

                          if (draggedIndex !== dragOverIndex && dragOverIndex !== null) {
                            const newOrder = [...visiblePagesOrder];
                            const [draggedItem] = newOrder.splice(draggedIndex, 1);
                            const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                            newOrder.splice(insertIndex, 0, draggedItem);
                            setVisiblePagesOrder(newOrder);
                          }
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: isDragging ? 'var(--accent-2)' : 'var(--panel-2)',
                          borderRadius: '8px',
                          border: isDragging ? '1px solid var(--accent)' : '1px solid var(--border)',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          transform: `translateY(${translateY}px)`,
                          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease, border-color 0.15s ease',
                          opacity: isDragging ? 0 : 1,
                          boxShadow: 'none',
                          zIndex: isDragging ? 10 : 1,
                          position: 'relative',
                          pointerEvents: isDragging ? 'none' : 'auto',
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
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                          {page}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                          <circle cx="5" cy="3" r="1.5" />
                          <circle cx="11" cy="3" r="1.5" />
                          <circle cx="5" cy="8" r="1.5" />
                          <circle cx="11" cy="8" r="1.5" />
                          <circle cx="5" cy="13" r="1.5" />
                          <circle cx="11" cy="13" r="1.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisiblePages(DEFAULT_VISIBLE_PAGES);
                    setVisiblePagesOrder(Object.values(PAGES).filter(p => p !== 'Settings'));
                  }}
                  style={{
                    marginTop: '16px',
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    boxShadow: 'none',
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {/* Dashboard Cards Customization */}
            {activeCustomizationTab === 'dashboard' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
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
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisibleDashboardCards(DEFAULT_VISIBLE_DASHBOARD_CARDS);
                  }}
                  style={{
                    marginTop: '16px',
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    boxShadow: 'none',
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {/* Tools Cards Customization */}
            {activeCustomizationTab === 'tools' && (
              <div style={{ opacity: isPremium ? 1 : 0.5, pointerEvents: isPremium ? 'auto' : 'none' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Drag to reorder cards or uncheck to hide them from the Tools page
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingIndex === null || dragOverIndex === null) return;
                    if (draggingIndex !== dragOverIndex) {
                      const newOrder = [...toolsCardsOrder];
                      const [draggedItem] = newOrder.splice(draggingIndex, 1);
                      const insertIndex = draggingIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                      newOrder.splice(insertIndex, 0, draggedItem);
                      setToolsCardsOrder(newOrder);
                    }
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  {toolsCardsOrder.map((cardId, index) => {
                    const isDragging = draggingIndex === index;
                    // Calculate if this item should shift up or down
                    let translateY = 0;
                    if (draggingIndex !== null && dragOverIndex !== null && !isDragging) {
                      const itemHeight = 48;
                      if (draggingIndex < dragOverIndex) {
                        if (index > draggingIndex && index < dragOverIndex) {
                          translateY = -itemHeight;
                        }
                      } else if (draggingIndex > dragOverIndex) {
                        if (index >= dragOverIndex && index < draggingIndex) {
                          translateY = itemHeight;
                        }
                      }
                    }

                    return (
                      <div
                        key={cardId}
                        data-card-id={cardId}
                        draggable
                        onDragStart={(e) => {
                          setDragOverIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', index.toString());

                          // Create custom drag image with glow effect
                          const dragEl = e.currentTarget.cloneNode(true) as HTMLElement;
                          dragEl.style.backgroundColor = 'var(--accent-2)';
                          dragEl.style.border = '1px solid var(--accent)';
                          dragEl.style.boxShadow = '0 0 12px var(--accent)';
                          dragEl.style.opacity = '0.9';
                          dragEl.style.transform = 'scale(1.02)';
                          dragEl.style.position = 'absolute';
                          dragEl.style.top = '-9999px';
                          dragEl.style.width = `${e.currentTarget.offsetWidth}px`;
                          document.body.appendChild(dragEl);
                          e.dataTransfer.setDragImage(dragEl, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          requestAnimationFrame(() => {
                            document.body.removeChild(dragEl);
                            setDraggingIndex(index);
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';

                          const rect = e.currentTarget.getBoundingClientRect();
                          const midpoint = rect.top + rect.height / 2;
                          const targetIndex = e.clientY < midpoint ? index : index + 1;

                          if (dragOverIndex !== targetIndex) {
                            setDragOverIndex(targetIndex);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

                          if (draggedIndex !== dragOverIndex && dragOverIndex !== null) {
                            const newOrder = [...toolsCardsOrder];
                            const [draggedItem] = newOrder.splice(draggedIndex, 1);
                            const insertIndex = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
                            newOrder.splice(insertIndex, 0, draggedItem);
                            setToolsCardsOrder(newOrder);
                          }
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: isDragging ? 'var(--accent-2)' : 'var(--panel-2)',
                          borderRadius: '8px',
                          border: isDragging ? '1px solid var(--accent)' : '1px solid var(--border)',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          transform: `translateY(${translateY}px)`,
                          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease, border-color 0.15s ease',
                          opacity: isDragging ? 0 : 1,
                          boxShadow: 'none',
                          zIndex: isDragging ? 10 : 1,
                          position: 'relative',
                          pointerEvents: isDragging ? 'none' : 'auto',
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
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ color: 'var(--text)', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                          {CARD_LABELS[cardId] || cardId}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                          <circle cx="5" cy="3" r="1.5" />
                          <circle cx="11" cy="3" r="1.5" />
                          <circle cx="5" cy="8" r="1.5" />
                          <circle cx="11" cy="8" r="1.5" />
                          <circle cx="5" cy="13" r="1.5" />
                          <circle cx="11" cy="13" r="1.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <Button
                  size={isMobile ? 'sm' : 'lg'}
                  variant="secondary"
                  onClick={() => {
                    setVisibleToolsCards(DEFAULT_VISIBLE_TOOLS_CARDS);
                    setToolsCardsOrder(Object.values(TOOLS_CARDS));
                  }}
                  style={{
                    marginTop: '16px',
                    paddingLeft: isMobile ? '12px' : '16px',
                    paddingRight: isMobile ? '12px' : '16px',
                    boxShadow: 'none',
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {/* Save Button */}
            <Button
              size={isMobile ? 'sm' : 'lg'}
              disabled={!isPremium}
              onClick={async () => {
                if (!isPremium) return;
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
                opacity: isPremium ? 1 : 0.5,
                cursor: isPremium ? 'pointer' : 'not-allowed',
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
                    marginBottom: '0',
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
                    marginBottom: '0',
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
