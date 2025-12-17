'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/tasks', label: 'Tasks', icon: '☐' },
  { href: '/courses', label: 'Courses', icon: '📚' },
  { href: '/deadlines', label: 'Deadlines', icon: '⏰' },
  { href: '/tools', label: 'Tools', icon: '⚙' },
  { href: '/settings', label: 'Settings', icon: '⚡' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden w-56 border-r border-slate-200 bg-white p-6 md:flex md:flex-col dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            BYU Survival
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tool
          </p>
        </div>
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white md:hidden dark:border-slate-700 dark:bg-slate-900">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium transition-all ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
