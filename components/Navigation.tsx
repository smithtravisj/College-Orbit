'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '→' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/courses', label: 'Courses', icon: '▬' },
  { href: '/deadlines', label: 'Deadlines', icon: '◆' },
  { href: '/tools', label: 'Tools', icon: '⚡' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden w-64 border-r border-gray-200 bg-white px-6 py-8 md:flex md:flex-col dark:border-gray-800 dark:bg-slate-950">
        <div className="mb-12">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            BYU
          </h1>
          <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Survival Tool
          </p>
        </div>
        <div className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <span className="text-base opacity-70 group-hover:opacity-100">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white md:hidden dark:border-gray-800 dark:bg-slate-950">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-4 text-xs font-medium transition-colors duration-200 ${
                pathname === item.href
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-base mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
