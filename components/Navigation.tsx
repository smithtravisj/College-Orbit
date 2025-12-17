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
      <nav className="hidden w-48 border-r border-gray-200 bg-white p-6 md:flex md:flex-col dark:border-gray-800 dark:bg-gray-950">
        <h1 className="mb-8 text-lg font-bold">BYU Survival Tool</h1>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded px-4 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white md:hidden dark:border-gray-800 dark:bg-gray-950">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-3 text-xs transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
