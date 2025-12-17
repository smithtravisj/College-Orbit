'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckSquare,
  BookOpen,
  Calendar,
  Wrench,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/deadlines', label: 'Deadlines', icon: Calendar },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] px-4 py-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[var(--accent-2)] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[var(--text)]">B</span>
          </div>
          <h1 className="text-base font-semibold text-[var(--text)] leading-tight">BYU Survival Tool</h1>
        </div>
        <div className="space-y-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-3 h-11 px-4 rounded-[var(--radius-control)] font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--text)] bg-[var(--accent-2)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-[var(--accent)]" />
                )}
                <Icon size={20} className="h-[20px] w-[20px] opacity-80 group-hover:opacity-100 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
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
                className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium transition-colors duration-150 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
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
