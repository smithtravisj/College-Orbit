'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  CheckSquare,
  BookOpen,
  Calendar,
  Wrench,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/deadlines', label: 'Deadlines', icon: Calendar },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)]" style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 className="font-semibold text-[var(--text)] leading-tight" style={{ padding: '0 8px', fontSize: '24px' }}>BYU Survival Tool</h1>
          {session?.user && (
            <div className="mt-3 text-sm text-[var(--text-muted)] truncate" style={{ paddingLeft: '20px' }}>
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-3 h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)] bg-[var(--accent-2)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{ padding: '0 12px' }}
              >
                <Icon size={22} className="h-[22px] w-[22px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Profile and Logout */}
        {session?.user && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 w-full h-12 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5"
              style={{ padding: '0 12px' }}
            >
              <User size={22} className="opacity-80" />
              <span>Profile</span>
            </Link>
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--panel)] md:hidden z-40">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center text-xs font-medium transition-colors duration-150 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
                style={{ padding: '12px 8px' }}
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
