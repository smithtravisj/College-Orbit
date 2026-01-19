'use client';

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getAppTitle } from '@/lib/universityTitles';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors, applyColorPalette, applyCustomColors } from '@/lib/collegeColors';
import NotificationBell from '@/components/NotificationBell';
import { DEFAULT_VISIBLE_PAGES } from '@/lib/customizationConstants';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { useMobileNav } from '@/context/MobileNavContext';
import {
  Home,
  CheckSquare,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  StickyNote,
  ShoppingCart,
  Wrench,
  Settings,
  User,
  LogOut,
  BarChart3,
} from 'lucide-react';
import styles from './Navigation.module.css';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/deadlines', label: 'Assignments', icon: Clock },
  { href: '/exams', label: 'Exams', icon: FileText },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Admin', icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedGradientIntensity = useAppStore((state) => state.settings.gradientIntensity) ?? 50;
  const savedGlowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Check premium status - premium features use defaults when not premium
  const { isPremium } = useSubscription();

  // Custom theme and visual effects are only active for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const gradientIntensity = isPremium ? savedGradientIntensity : 50;
  const glowIntensity = isPremium ? savedGlowIntensity : 50;

  // Get college color palette for theming
  const colorPalette = getCollegeColorPalette(university || null, theme);

  // Get accent color (custom or college)
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : colorPalette.accent;

  // Calculate intensity scales - use quadratic scaling so 50% = 1x, 100% = 4x
  const gradientScale = Math.pow(gradientIntensity / 50, 2);
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.75 * glowScale * 255)).toString(16).padStart(2, '0'); // BF at 50%, capped at FF

  // Compute gradient values (0.08/0.12 at 50%, 0.32/0.48 at 100%)
  const gradientLightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
  const gradientDarkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
  const activeGradient = gradientIntensity > 0
    ? `linear-gradient(135deg, rgba(255,255,255,${gradientLightOpacity}) 0%, transparent 50%, rgba(0,0,0,${gradientDarkOpacity}) 100%)`
    : 'none';
  const savedVisiblePages = useAppStore((state) => state.settings.visiblePages || DEFAULT_VISIBLE_PAGES);
  const savedVisiblePagesOrder = useAppStore((state) => state.settings.visiblePagesOrder);

  // Page visibility is only customizable for premium users - free users see defaults
  const rawVisiblePages = isPremium ? savedVisiblePages : DEFAULT_VISIBLE_PAGES;
  const rawVisiblePagesOrder = isPremium ? savedVisiblePagesOrder : null;

  // Migrate "Deadlines" to "Assignments"
  const visiblePages = rawVisiblePages.map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
  const visiblePagesOrder = rawVisiblePagesOrder ? (rawVisiblePagesOrder as string[]).map((p: string) => p === 'Deadlines' ? 'Assignments' : p) : rawVisiblePagesOrder;
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

    if (effectiveUseCustomTheme && effectiveCustomColors) {
      // Apply custom colors for the current theme
      const colorSet = getCustomColorSetForTheme(effectiveCustomColors as CustomColors, theme);
      applyCustomColors(colorSet, theme);
    } else {
      // Apply college colors (this includes when user is not premium)
      // Calculate fresh palette to avoid stale references
      const freshPalette = getCollegeColorPalette(university || null, theme);
      applyColorPalette(freshPalette);
    }
  }, [isPremium, savedUseCustomTheme, savedCustomColors, theme, university]);

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
    // Delay calculation to ensure DOM is ready
    const timer = setTimeout(calculateTitleSize, 50);
    window.addEventListener('resize', calculateTitleSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateTitleSize);
    };
  }, [calculateTitleSize, university]);

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
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
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
        <div className="space-y-3 flex-1" style={{ position: 'relative', zIndex: 1 }}>
          {sortedNavItems.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                data-tour={item.label === 'Settings' ? 'settings-link' : item.label === 'Courses' ? 'courses-link' : undefined}
                className={`nav-link-hover relative flex items-center gap-2.5 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 11px',
                  backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                  backgroundImage: isActive
                    ? activeGradient
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`
                    : undefined,
                }}
              >
                <Icon size={20} className="h-[20px] w-[20px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          {showAdminNav && ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link-hover relative flex items-center gap-2.5 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 11px',
                  backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                  backgroundImage: isActive
                    ? activeGradient
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`
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
                className={`nav-link-hover flex items-center gap-2.5 flex-1 h-11 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  pathname === '/account'
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{
                  padding: '0 16px 0 11px',
                  backgroundColor: pathname === '/account' ? 'var(--nav-active)' : 'transparent',
                  backgroundImage: pathname === '/account'
                    ? activeGradient
                    : 'none',
                  boxShadow: pathname === '/account'
                    ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`
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
              <div style={{ paddingRight: '4px' }}>
                <NotificationBell />
              </div>
            </div>
            {session?.user && (
              <p className={styles.drawerUserEmail}>{session.user.name || session.user.email}</p>
            )}
          </div>

          {/* Navigation links */}
          <nav className={styles.drawerNav} style={{ position: 'relative', zIndex: 1 }}>
            {sortedNavItems.filter(item => (visiblePages.includes(item.label) || item.label === 'Settings') && item.label !== 'Tools').map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
            {showAdminNav && ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                className={`${styles.drawerLink} ${pathname === '/account' ? styles.active : ''}`}
                style={pathname === '/account' ? {
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
