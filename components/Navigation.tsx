'use client';

import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getAppTitle } from '@/lib/universityTitles';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors, applyColorPalette, applyCustomColors, applyColorblindMode, ColorblindMode, ColorblindStyle } from '@/lib/collegeColors';
import { applyVisualTheme, clearVisualTheme, getThemeColors } from '@/lib/visualThemes';
import NotificationBell from '@/components/NotificationBell';
import { DEFAULT_VISIBLE_PAGES } from '@/lib/customizationConstants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { useMobileNav } from '@/context/MobileNavContext';
import { isOverdue } from '@/lib/utils';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';
import {
  Home,
  PenLine,
  BookOpen,
  Calendar,
  FileText,
  StickyNote,
  ShoppingCart,
  Wrench,
  TrendingUp,
  Settings,
  User,
  LogOut,
  BarChart3,
  Search,
} from 'lucide-react';
import { useKeyboardShortcutsContext } from '@/components/KeyboardShortcutsProvider';
import styles from './Navigation.module.css';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/work', label: 'Work', icon: PenLine },
  { href: '/exams', label: 'Exams', icon: FileText },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Admin', icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // Clear pending nav when pathname changes (page has loaded)
  useEffect(() => {
    setPendingNav(null);
  }, [pathname]);
  const { data: session, status: sessionStatus } = useSession();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const savedGradientIntensity = useAppStore((state) => state.settings.gradientIntensity) ?? 50;
  const savedGlowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;
  const colorblindMode = useAppStore((state) => state.settings.colorblindMode);
  const colorblindStyle = useAppStore((state) => state.settings.colorblindStyle);

  // Check premium status - premium features use defaults when not premium
  const { isPremium } = useSubscription();

  // Custom theme and visual effects are only active for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const gradientIntensity = isPremium ? savedGradientIntensity : 50;
  const glowIntensity = isPremium ? savedGlowIntensity : 50;

  // Get college color palette for theming
  const colorPalette = getCollegeColorPalette(university || null, theme);

  // Get visual theme (premium only)
  const visualTheme = isPremium ? savedVisualTheme : null;

  // Get accent color - visual theme takes priority
  const accentColor = (() => {
    if (visualTheme && visualTheme !== 'default') {
      const themeColors = getThemeColors(visualTheme, theme);
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return colorPalette.accent;
  })();

  // Calculate intensity scales - use quadratic scaling so 50% = 1x, 100% = 4x
  const gradientScale = Math.pow(gradientIntensity / 50, 2);
  const glowScale = glowIntensity / 50;
  const isLightMode = useIsLightMode();
  // Reduce glow intensity when no college is selected (default theme)
  const noCollegeSelected = !university;
  const glowReduction = noCollegeSelected ? 0.5 : 1;
  const glowOpacity = isLightMode
    ? Math.min(255, Math.round(0.6 * glowScale * glowReduction * 255)).toString(16).padStart(2, '0')
    : Math.min(255, Math.round(0.25 * glowScale * glowReduction * 255)).toString(16).padStart(2, '0');
  const glowSpread = (12 + (glowIntensity / 100) * 8) * glowReduction;

  // Compute gradient values (0.08/0.12 at 50%, 0.32/0.48 at 100%)
  const gradientLightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
  const gradientDarkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
  const gradient = `linear-gradient(135deg, rgba(255,255,255,${gradientLightOpacity}) 0%, transparent 50%, rgba(0,0,0,${gradientDarkOpacity}) 100%)`;
  const darkOverlay = 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))';
  const activeGradient = gradientIntensity > 0
    ? (isLightMode ? gradient : `${darkOverlay}, ${gradient}`)
    : (isLightMode ? 'none' : darkOverlay);
  const savedVisiblePages = useAppStore((state) => state.settings.visiblePages || DEFAULT_VISIBLE_PAGES);
  const savedVisiblePagesOrder = useAppStore((state) => state.settings.visiblePagesOrder);

  // Page visibility is only customizable for premium users - free users see defaults
  const rawVisiblePages = isPremium ? savedVisiblePages : DEFAULT_VISIBLE_PAGES;
  const rawVisiblePagesOrder = isPremium ? savedVisiblePagesOrder : null;

  // Migrate "Deadlines", "Assignments", and "Tasks" to unified "Work" page
  const migratePageName = (p: string) => {
    if (p === 'Deadlines' || p === 'Assignments' || p === 'Tasks') return 'Work';
    return p;
  };
  // Remove duplicates after migration (in case both Tasks and Assignments/Deadlines exist)
  const visiblePages = [...new Set(rawVisiblePages.map(migratePageName))];
  const visiblePagesOrder = rawVisiblePagesOrder
    ? [...new Set((rawVisiblePagesOrder as string[]).map(migratePageName))]
    : rawVisiblePagesOrder;

  // Nav counts settings
  const showNavCounts = useAppStore((state) => state.settings.showNavCounts) ?? false;
  const showNavCountTasks = useAppStore((state) => state.settings.showNavCountTasks) ?? true;
  const showNavCountExams = useAppStore((state) => state.settings.showNavCountExams) ?? true;

  // Get data for counts - use workItems (unified) or fall back to tasks for backward compatibility
  // Note: Matches the work page logic which uses workItems or tasks, not deadlines separately
  const workItems = useAppStore((state) => state.workItems);
  const tasks = useAppStore((state) => state.tasks);
  const exams = useAppStore((state) => state.exams);

  // Calculate counts
  const navCounts = useMemo(() => {
    if (!showNavCounts) return {};

    const counts: Record<string, number> = {};

    if (showNavCountTasks) {
      // Use workItems if available, otherwise fall back to tasks
      // This matches the work page logic: useWorkItems = workItems.length > 0 || tasks.length === 0
      const useWorkItems = workItems.length > 0 || tasks.length === 0;
      if (useWorkItems) {
        const overdueWorkItems = workItems.filter(w => w.status === 'open' && w.dueAt && isOverdue(w.dueAt)).length;
        if (overdueWorkItems > 0) counts['Work'] = overdueWorkItems;
      } else {
        const overdueTasks = tasks.filter(t => t.status === 'open' && t.dueAt && isOverdue(t.dueAt)).length;
        if (overdueTasks > 0) counts['Work'] = overdueTasks;
      }
    }

    if (showNavCountExams) {
      const totalExams = exams.length;
      if (totalExams > 0) counts['Exams'] = totalExams;
    }

    return counts;
  }, [showNavCounts, showNavCountTasks, showNavCountExams, workItems, tasks, exams]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted on client to enable localStorage check (useLayoutEffect runs before paint)
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Re-apply colors when premium status changes to ensure correct theme is applied
  // We use the saved values and isPremium directly to avoid stale closures
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Determine effective values based on premium status
    const effectiveUseCustomTheme = isPremium && savedUseCustomTheme;
    const effectiveCustomColors = isPremium ? savedCustomColors : null;
    const effectiveVisualTheme = isPremium ? savedVisualTheme : null;

    let basePalette;
    if (effectiveUseCustomTheme && effectiveCustomColors) {
      // Apply custom colors for the current theme
      const colorSet = getCustomColorSetForTheme(effectiveCustomColors as CustomColors, theme);
      applyCustomColors(colorSet, theme);
      basePalette = getCollegeColorPalette(university || null, theme);
    } else {
      // Apply college colors (this includes when user is not premium)
      // Calculate fresh palette to avoid stale references
      basePalette = getCollegeColorPalette(university || null, theme);
      applyColorPalette(basePalette);
    }

    // Apply visual theme on top (premium only)
    if (effectiveVisualTheme && effectiveVisualTheme !== 'default') {
      applyVisualTheme(effectiveVisualTheme, theme, basePalette);
    } else {
      clearVisualTheme();
    }

    // Re-apply colorblind mode after palette (must come after to override semantic colors)
    // Skip palette changes if custom theme is active (custom theme takes priority)
    applyColorblindMode(
      colorblindMode as ColorblindMode | null,
      colorblindStyle as ColorblindStyle | null,
      theme,
      effectiveUseCustomTheme
    );
  }, [isPremium, savedUseCustomTheme, savedCustomColors, savedVisualTheme, theme, university, colorblindMode, colorblindStyle]);

  // Check localStorage directly after mount for instant display
  const showAdminNav = isAdmin || (mounted && localStorage.getItem('isAdmin') === 'true');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const [titleFontSize, setTitleFontSize] = useState(32);

  // Auto-scale title font size to fit container
  const calculateTitleSize = useCallback(() => {
    if (!titleRef.current || !titleContainerRef.current) return;

    const title = titleRef.current;
    // Nav is 200px wide with 16px padding on each side = 168px available
    const containerWidth = 168;

    // Start with max font size and scale down if needed
    let fontSize = 36;
    title.style.fontSize = `${fontSize}px`;

    while (title.scrollWidth > containerWidth && fontSize > 18) {
      fontSize -= 1;
      title.style.fontSize = `${fontSize}px`;
    }

    setTitleFontSize(fontSize);
  }, []);

  useEffect(() => {
    // Delay calculation to ensure DOM and fonts are ready
    const timer = setTimeout(calculateTitleSize, 50);
    // Recalculate after fonts load (theme fonts like Comfortaa may be wider)
    const fontTimer = setTimeout(calculateTitleSize, 300);
    window.addEventListener('resize', calculateTitleSize);
    return () => {
      clearTimeout(timer);
      clearTimeout(fontTimer);
      window.removeEventListener('resize', calculateTitleSize);
    };
  }, [calculateTitleSize, university, savedVisualTheme]);

  // Sort NAV_ITEMS according to visiblePagesOrder if it exists
  const sortedNavItems = (() => {
    if (!visiblePagesOrder || typeof visiblePagesOrder === 'string') {
      return NAV_ITEMS;
    }

    // Create a map of page labels to their order index
    const orderMap: Record<string, number> = {};
    (visiblePagesOrder as string[]).forEach((page, index) => {
      orderMap[page] = index;
    });

    // Sort NAV_ITEMS by the order, keeping items not in the order at the end
    return [...NAV_ITEMS].sort((a, b) => {
      const orderA = orderMap[a.label];
      const orderB = orderMap[b.label];

      // If both are in the order, sort by order
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }

      // If only a is in order, it comes first
      if (orderA !== undefined) return -1;

      // If only b is in order, it comes first
      if (orderB !== undefined) return 1;

      // If neither are in order, maintain original order
      return 0;
    });
  })();

  // All nav items are available to all users
  const filteredNavItems = sortedNavItems;

  // Clear admin status when user logs out, validate in background for logged-in users
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      setIsAdmin(false);
      localStorage.removeItem('isAdmin');
      return;
    }

    // Validate admin status when authenticated
    if (sessionStatus === 'authenticated') {
      fetch('/api/analytics/data')
        .then(response => {
          if (response.status === 403) {
            setIsAdmin(false);
            localStorage.removeItem('isAdmin');
          } else if (response.ok) {
            setIsAdmin(true);
            localStorage.setItem('isAdmin', 'true');
          }
        })
        .catch(() => {});
    }
  }, [sessionStatus]);

  const handleLogout = async () => {
    // Clear userId on logout so next login doesn't load wrong cache
    // BUT keep the user's data cache so if they log back in, it loads instantly
    if (typeof window !== 'undefined') {
      localStorage.removeItem('college-orbit-userId');
      // Clear volatile caches that shouldn't persist across sessions
      localStorage.removeItem('timeline_cache_today');
      localStorage.removeItem('timeline_cache_week');
      localStorage.removeItem('calendarCache');
    }
    await signOut({ callbackUrl: '/login' });
  };

  // Hide navigation on auth pages when not signed in
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isAuthPage && !session) {
    return null;
  }

  const isMobile = useIsMobile();
  const { isDrawerOpen, closeDrawer } = useMobileNav();
  const drawerRef = useRef<HTMLDivElement>(null);
  const { openGlobalSearch } = useKeyboardShortcutsContext();

  // Close drawer when pathname changes
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Handle click outside drawer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is on the FAB (hamburger button)
      const fabButton = document.querySelector('[data-tour="mobile-hamburger"]');
      if (fabButton && (fabButton.contains(e.target as Node) || fabButton === e.target)) {
        console.log('[Navigation] Click on FAB, ignoring');
        return;
      }

      console.log('[Navigation] Click outside handler fired', {
        target: (e.target as HTMLElement)?.className,
        inDrawer: drawerRef.current?.contains(e.target as Node)
      });
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        console.log('[Navigation] Closing drawer due to click outside');
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  return (
    <>
      {/* Desktop Sidebar - Floating */}
      <nav
        className="hidden md:flex flex-col overflow-y-auto bg-[var(--panel)]"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          bottom: '16px',
          width: '200px',
          padding: '20px 16px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          boxShadow: isLightMode ? '0 2px 12px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.2)',
          zIndex: 50,
        }}
        data-tour="navigation"
      >
        <div ref={titleContainerRef} style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <h1 ref={titleRef} className="font-semibold text-[var(--text)] leading-tight" style={{ padding: '0 8px', fontSize: `${titleFontSize}px`, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>{getAppTitle(university)}</h1>
          {session?.user && (
            <div className="mt-3 text-sm text-[var(--text-muted)] truncate" style={{ paddingLeft: '20px' }}>
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
        {/* Search button */}
        <button
          onClick={openGlobalSearch}
          className="nav-link-hover flex items-center gap-2.5 w-full h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 group"
          style={{ padding: '0 11px', marginBottom: '12px', position: 'relative', zIndex: 1 }}
        >
          <Search size={20} className="opacity-80 group-hover:opacity-100" />
          <span className="truncate">Search</span>
        </button>
        <div className="space-y-3 flex-1" style={{ position: 'relative', zIndex: 1 }}>
          {filteredNavItems.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
            const Icon = item.icon;
            const isActive = (pendingNav ? pendingNav === item.href : pathname === item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPendingNav(item.href)}
                aria-current={isActive ? 'page' : undefined}
                data-tour={item.label === 'Settings' ? 'settings-link' : item.label === 'Courses' ? 'courses-link' : undefined}
                className={`nav-link-hover relative flex items-center gap-2.5 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 11px',
                  backgroundColor: isActive ? accentColor : 'transparent',
                  backgroundImage: isActive
                    ? activeGradient
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 ${glowSpread}px ${accentColor}${glowOpacity}, 0 3px 12px ${accentColor}40`
                    : undefined,
                }}
              >
                <Icon size={20} className="h-[20px] w-[20px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate flex-1">{item.label}</span>
                {navCounts[item.label] && (
                  <span
                    style={{
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      backgroundColor: item.label === 'Exams' ? 'var(--accent)' : 'var(--danger)',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {navCounts[item.label]}
                  </span>
                )}
              </Link>
            );
          })}
          {showAdminNav && ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = (pendingNav ? pendingNav === item.href : pathname === item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPendingNav(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link-hover relative flex items-center gap-2.5 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 11px',
                  backgroundColor: isActive ? accentColor : 'transparent',
                  backgroundImage: isActive
                    ? activeGradient
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 ${glowSpread}px ${accentColor}${glowOpacity}, 0 3px 12px ${accentColor}40`
                    : undefined,
                }}
              >
                <Icon size={20} className="h-[20px] w-[20px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Account and Logout */}
        {session?.user && (
          <div className="mt-4 space-y-2" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between">
              <Link
                href="/account"
                onClick={() => setPendingNav('/account')}
                className={`nav-link-hover flex items-center gap-2.5 flex-1 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  (pendingNav ? pendingNav === '/account' : pathname === '/account')
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 16px 0 11px',
                  backgroundColor: (pendingNav ? pendingNav === '/account' : pathname === '/account') ? accentColor : 'transparent',
                  backgroundImage: (pendingNav ? pendingNav === '/account' : pathname === '/account')
                    ? activeGradient
                    : 'none',
                  boxShadow: (pendingNav ? pendingNav === '/account' : pathname === '/account')
                    ? `0 0 ${glowSpread}px ${accentColor}${glowOpacity}, 0 3px 12px ${accentColor}40`
                    : undefined,
                }}
              >
                <User size={20} className="opacity-80 group-hover:opacity-100" />
                <span>Account</span>
              </Link>
              <div style={{ paddingLeft: '9px', paddingRight: '2px' }}>
                <NotificationBell />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="nav-link-hover flex items-center gap-2.5 w-full h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 text-[var(--muted)] hover:text-[var(--text)] group"
              style={{ padding: '0 11px' }}
            >
              <LogOut size={20} className="opacity-80 group-hover:opacity-100" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Backdrop */}
      {isMobile && isDrawerOpen && <div className={styles.backdrop} onClick={closeDrawer} />}

      {/* Mobile Drawer Navigation */}
      {isMobile && (
        <div ref={drawerRef} className={styles.drawer} data-open={isDrawerOpen ? 'true' : 'false'}>
          {/* Drawer header with title and notification */}
          <div className={styles.drawerHeader} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
              <h2 className={styles.drawerTitle}>{getAppTitle(university)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '4px' }}>
                <button
                  onClick={() => {
                    closeDrawer();
                    openGlobalSearch();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                <NotificationBell />
              </div>
            </div>
            {session?.user && (
              <p className={styles.drawerUserEmail}>{session.user.name || session.user.email}</p>
            )}
          </div>

          {/* Navigation links */}
          <nav className={styles.drawerNav} style={{ position: 'relative', zIndex: 1 }}>
            {filteredNavItems.filter(item => (visiblePages.includes(item.label) || item.label === 'Settings') && item.label !== 'Tools').map((item) => {
              const Icon = item.icon;
              const isActive = (pendingNav ? pendingNav === item.href : pathname === item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setPendingNav(item.href)}
                  className={`${styles.drawerLink} ${isActive ? styles.active : ''}`}
                  style={isActive ? {
                    backgroundImage: activeGradient,
                    boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                  } : undefined}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {navCounts[item.label] && (
                    <span
                      style={{
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        fontSize: '10px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9px',
                        backgroundColor: item.label === 'Exams' ? 'var(--accent)' : 'var(--danger)',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      {navCounts[item.label]}
                    </span>
                  )}
                </Link>
              );
            })}
            {showAdminNav && ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = (pendingNav ? pendingNav === item.href : pathname === item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setPendingNav(item.href)}
                  className={`${styles.drawerLink} ${isActive ? styles.active : ''}`}
                  style={isActive ? {
                    backgroundImage: activeGradient,
                    boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                  } : undefined}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer footer with account/logout */}
          {session?.user && (
            <div className={styles.drawerFooter} style={{ position: 'relative', zIndex: 1 }}>
              <Link
                href="/account"
                onClick={() => setPendingNav('/account')}
                className={`${styles.drawerLink} ${(pendingNav ? pendingNav === '/account' : pathname === '/account') ? styles.active : ''}`}
                style={(pendingNav ? pendingNav === '/account' : pathname === '/account') ? {
                  backgroundImage: activeGradient,
                  boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                } : undefined}
              >
                <User size={20} />
                <span>Account</span>
              </Link>
              <button onClick={handleLogout} className={styles.drawerLink}>
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
