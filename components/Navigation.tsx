'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useAppStore from '@/lib/store';
import { getAppTitle } from '@/lib/universityTitles';
import NotificationBell from '@/components/NotificationBell';
import { DEFAULT_VISIBLE_PAGES } from '@/lib/customizationConstants';
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
} from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)]" style={{ padding: '20px 16px' }} data-tour="navigation">
        <div style={{ marginBottom: '16px' }}>
          <h1 className="font-semibold text-[var(--text)] leading-tight" style={{ padding: '0 8px', fontSize: university === 'Brigham Young University Hawaii' ? '22px' : university === 'Brigham Young University Idaho' ? '23px' : (university === 'Brigham Young University' || university === 'UNC Chapel Hill' || university === 'Utah State University' || university === 'Utah Valley University' || university === 'Arizona State University') ? '24px' : '21px' }}>{getAppTitle(university)}</h1>
          {session?.user && (
            <div className="mt-3 text-sm text-[var(--text-muted)] truncate" style={{ paddingLeft: '20px' }}>
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          {NAV_ITEMS.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
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

      {/* Mobile Header with Notification */}
      {session?.user && (
        <div className="md:hidden fixed top-0 left-0 right-0 border-b border-[var(--border)] bg-[var(--panel)] z-40 flex justify-end items-center" style={{ padding: '12px 16px', height: '56px' }}>
          <NotificationBell />
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--panel)] md:hidden z-40">
        <div className="flex justify-around overflow-x-auto">
          {NAV_ITEMS.filter(item => visiblePages.includes(item.label) || item.label === 'Settings').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-150 flex-shrink-0 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
                style={{ padding: '12px 8px', minWidth: 'auto' }}
              >
                <Icon size={24} className="mb-1" />
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
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-150 flex-shrink-0 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
                style={{ padding: '12px 8px', minWidth: 'auto' }}
              >
                <Icon size={24} className="mb-1" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
