'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getAppTitle } from '@/lib/universityTitles';
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
  Wrench,
  Settings,
  User,
  LogOut,
  BarChart3,
  X,
} from 'lucide-react';
import styles from './Navigation.module.css';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/deadlines', label: 'Deadlines', icon: Clock },
  { href: '/exams', label: 'Exams', icon: FileText },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/courses', label: 'Courses', icon: BookOpen },
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
  const visiblePages = useAppStore((state) => state.settings.visiblePages || DEFAULT_VISIBLE_PAGES);
  const visiblePagesOrder = useAppStore((state) => state.settings.visiblePagesOrder);
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
      {/* Desktop Sidebar - UNCHANGED */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)]" style={{ padding: '20px 16px' }} data-tour="navigation">
        <div style={{ marginBottom: '16px' }}>
          <h1 className="font-semibold text-[var(--text)] leading-tight" style={{ padding: '0 8px', fontSize: university === 'Brigham Young University Hawaii' ? '22px' : university === 'Brigham Young University Idaho' ? '23px' : (university === 'Brigham Young University' || university === 'UNC Chapel Hill' || university === 'Utah State University' || university === 'Utah Valley University' || university === 'Arizona State University' || university === 'University of Central Florida' || university === 'Ohio State University') ? '24px' : '21px' }}>{getAppTitle(university)}</h1>
          {session?.user && (
            <div className="mt-3 text-sm text-[var(--text-muted)] truncate" style={{ paddingLeft: '20px' }}>
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          {sortedNavItems.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                data-tour={item.label === 'Settings' ? 'settings-link' : item.label === 'Courses' ? 'courses-link' : undefined}
                className={`relative flex items-center gap-3 h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{ padding: '0 12px', backgroundColor: isActive ? 'var(--nav-active)' : 'transparent' }}
              >
                <Icon size={22} className="h-[22px] w-[22px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
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
                className={`relative flex items-center gap-3 h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{ padding: '0 12px', backgroundColor: isActive ? 'var(--nav-active)' : 'transparent' }}
              >
                <Icon size={22} className="h-[22px] w-[22px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Profile and Logout */}
        {session?.user && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="flex items-center gap-3 flex-1 h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5"
                style={{ padding: '0 12px' }}
              >
                <User size={22} className="opacity-80" />
                <span>Profile</span>
              </Link>
              <div style={{ paddingRight: '8px' }}>
                <NotificationBell />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5"
              style={{ padding: '0 12px' }}
            >
              <LogOut size={22} className="opacity-80" />
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
          {/* Close button */}
          <button
            onClick={closeDrawer}
            className={styles.closeButton}
            aria-label="Close navigation menu"
            type="button"
          >
            <X size={24} />
          </button>

          {/* Drawer header with title and notification */}
          <div className={styles.drawerHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
          <nav className={styles.drawerNav}>
            {sortedNavItems.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.drawerLink} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
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
                  className={`${styles.drawerLink} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer footer with profile/logout */}
          {session?.user && (
            <div className={styles.drawerFooter}>
              <Link href="/profile" className={styles.drawerLink}>
                <User size={20} />
                <span>Profile</span>
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
