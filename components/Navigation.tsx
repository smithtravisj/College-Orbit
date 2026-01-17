'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getAppTitle } from '@/lib/universityTitles';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import NotificationBell from '@/components/NotificationBell';
import { DEFAULT_VISIBLE_PAGES } from '@/lib/customizationConstants';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';

  // Get college color palette for theming
  const colorPalette = getCollegeColorPalette(university || null, theme);
  const rawVisiblePages = useAppStore((state) => state.settings.visiblePages || DEFAULT_VISIBLE_PAGES);
  const rawVisiblePagesOrder = useAppStore((state) => state.settings.visiblePagesOrder);
  // Migrate "Deadlines" to "Assignments"
  const visiblePages = rawVisiblePages.map((p: string) => p === 'Deadlines' ? 'Assignments' : p);
  const visiblePagesOrder = rawVisiblePagesOrder ? (rawVisiblePagesOrder as string[]).map((p: string) => p === 'Deadlines' ? 'Assignments' : p) : rawVisiblePagesOrder;
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Check if user is admin
  useEffect(() => {
    if (!session?.user?.id) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/analytics/data').catch(() => null);
        if (response && response.status !== 403) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [session?.user?.id]);

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
      {/* Desktop Sidebar */}
      <nav
        className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)]"
        style={{
          padding: '20px 16px',
        }}
        data-tour="navigation"
      >
        <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <h1 className="font-semibold text-[var(--text)] leading-tight" style={{ padding: '0 8px', fontSize: '28px' }}>{getAppTitle(university)}</h1>
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
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 10px ${colorPalette.accent}BF`
                    : undefined,
                }}
              >
                <Icon size={20} className="h-[20px] w-[20px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && ADMIN_NAV_ITEMS.map((item) => {
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
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                    : 'none',
                  boxShadow: isActive
                    ? `0 0 10px ${colorPalette.accent}BF`
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
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                    : 'none',
                  boxShadow: pathname === '/account'
                    ? `0 0 10px ${colorPalette.accent}BF`
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
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                    boxShadow: `0 0 10px ${colorPalette.accent}BF`,
                  } : undefined}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isAdmin && ADMIN_NAV_ITEMS.filter(item => item.label !== 'Analytics').map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.drawerLink} ${isActive ? styles.active : ''}`}
                  style={isActive ? {
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                    boxShadow: `0 0 10px ${colorPalette.accent}BF`,
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
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  boxShadow: `0 0 10px ${colorPalette.accent}BF`,
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
