'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Shortcut definitions for documentation
export const KEYBOARD_SHORTCUTS = {
  navigation: {
    title: 'Navigation (press G, then...)',
    shortcuts: [
      { keys: ['G', 'H'], description: 'Go to Dashboard (Home)' },
      { keys: ['G', 'C'], description: 'Go to Calendar' },
      { keys: ['G', 'T'], description: 'Go to Tasks' },
      { keys: ['G', 'A'], description: 'Go to Assignments' },
      { keys: ['G', 'E'], description: 'Go to Exams' },
      { keys: ['G', 'N'], description: 'Go to Notes' },
      { keys: ['G', 'O'], description: 'Go to Courses' },
      { keys: ['G', 'S'], description: 'Go to Shopping' },
      { keys: ['G', 'L'], description: 'Go to Tools' },
      { keys: ['G', ','], description: 'Go to Settings' },
    ],
  },
  global: {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open Quick Add' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Esc'], description: 'Close modal / Cancel' },
    ],
  },
  page: {
    title: 'Page Actions',
    shortcuts: [
      { keys: ['N'], description: 'New item' },
      { keys: ['⌘', 'Enter'], description: 'Submit / Save' },
      { keys: ['⌘', '⌫'], description: 'Delete selected' },
      { keys: ['⌘', 'A'], description: 'Select all' },
      { keys: ['⌘', 'D'], description: 'Deselect all' },
    ],
  },
  list: {
    title: 'List Navigation',
    shortcuts: [
      { keys: ['J'], description: 'Next item' },
      { keys: ['K'], description: 'Previous item' },
      { keys: ['Enter'], description: 'Open selected' },
      { keys: ['X'], description: 'Toggle selection' },
    ],
  },
};

// Navigation routes
const NAV_ROUTES: Record<string, string> = {
  h: '/',
  c: '/calendar',
  t: '/tasks',
  a: '/deadlines',
  e: '/exams',
  n: '/notes',
  o: '/courses',
  s: '/shopping',
  l: '/tools',
  ',': '/settings',
};

interface UseKeyboardShortcutsOptions {
  onQuickAdd?: () => void;
  onShowHelp?: () => void;
  onSearch?: () => void;
  onNewItem?: () => void;
  onSubmit?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onNextItem?: () => void;
  onPrevItem?: () => void;
  onOpenSelected?: () => void;
  onToggleSelection?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingNav = useRef<string | null>(null);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    onQuickAdd,
    onShowHelp,
    onSearch,
    onNewItem,
    onSubmit,
    onDelete,
    onSelectAll,
    onDeselectAll,
    onNextItem,
    onPrevItem,
    onOpenSelected,
    onToggleSelection,
    onEscape,
    disabled = false,
  } = options;

  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isEditable = activeElement.getAttribute('contenteditable') === 'true';
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

    return isInput || isEditable;
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    const { key, metaKey, ctrlKey, shiftKey } = event;
    const modKey = metaKey || ctrlKey;
    const lowerKey = key.toLowerCase();

    // Always allow Escape
    if (key === 'Escape') {
      if (onEscape) {
        onEscape();
      }
      // Clear any pending navigation
      pendingNav.current = null;
      if (navTimeout.current) {
        clearTimeout(navTimeout.current);
        navTimeout.current = null;
      }
      return;
    }

    // Handle G-key navigation sequence
    if (pendingNav.current === 'g') {
      event.preventDefault();
      const route = NAV_ROUTES[lowerKey];
      if (route && route !== pathname) {
        router.push(route);
      }
      pendingNav.current = null;
      if (navTimeout.current) {
        clearTimeout(navTimeout.current);
        navTimeout.current = null;
      }
      return;
    }

    // Don't trigger shortcuts when typing in inputs (except for mod+key combos and escape)
    const inputFocused = isInputFocused();

    // Cmd/Ctrl shortcuts (work even in inputs)
    if (modKey) {
      // Cmd+K - Quick Add (prevent browser default)
      if (lowerKey === 'k' && !shiftKey) {
        event.preventDefault();
        if (onQuickAdd) onQuickAdd();
        return;
      }

      // Cmd+Enter - Submit
      if (key === 'Enter' && !shiftKey) {
        if (onSubmit) {
          event.preventDefault();
          onSubmit();
        }
        return;
      }

      // Cmd+Backspace - Delete (only when not in input)
      if (key === 'Backspace' && !inputFocused) {
        if (onDelete) {
          event.preventDefault();
          onDelete();
        }
        return;
      }

      // Cmd+A - Select all (override default only on list pages)
      if (lowerKey === 'a' && !shiftKey && !inputFocused && onSelectAll) {
        event.preventDefault();
        onSelectAll();
        return;
      }

      // Cmd+D - Deselect all
      if (lowerKey === 'd' && !shiftKey && !inputFocused && onDeselectAll) {
        event.preventDefault();
        onDeselectAll();
        return;
      }

      return; // Don't process other shortcuts with mod key held
    }

    // Don't process single-key shortcuts when in input
    if (inputFocused) return;

    // ? - Show help
    if (key === '?' || (shiftKey && key === '/')) {
      event.preventDefault();
      if (onShowHelp) onShowHelp();
      return;
    }

    // / - Focus search (find any search input on the page)
    if (key === '/' && !shiftKey) {
      event.preventDefault();
      if (onSearch) {
        onSearch();
      } else {
        // Default behavior: focus first search input on the page
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      return;
    }

    // G - Start navigation sequence
    if (lowerKey === 'g' && !shiftKey) {
      event.preventDefault();
      pendingNav.current = 'g';
      // Auto-cancel after 1.5 seconds
      navTimeout.current = setTimeout(() => {
        pendingNav.current = null;
      }, 1500);
      return;
    }

    // N - New item (opens quick add by default)
    if (lowerKey === 'n' && !shiftKey) {
      event.preventDefault();
      if (onNewItem) {
        onNewItem();
      } else if (onQuickAdd) {
        // Default to opening quick add if no specific new item handler
        onQuickAdd();
      }
      return;
    }

    // J - Next item
    if (lowerKey === 'j' && !shiftKey) {
      if (onNextItem) {
        event.preventDefault();
        onNextItem();
      }
      return;
    }

    // K - Previous item
    if (lowerKey === 'k' && !shiftKey) {
      if (onPrevItem) {
        event.preventDefault();
        onPrevItem();
      }
      return;
    }

    // Enter - Open selected
    if (key === 'Enter' && !shiftKey) {
      if (onOpenSelected) {
        event.preventDefault();
        onOpenSelected();
      }
      return;
    }

    // X - Toggle selection
    if (lowerKey === 'x' && !shiftKey) {
      if (onToggleSelection) {
        event.preventDefault();
        onToggleSelection();
      }
      return;
    }
  }, [
    disabled,
    pathname,
    router,
    isInputFocused,
    onQuickAdd,
    onShowHelp,
    onSearch,
    onNewItem,
    onSubmit,
    onDelete,
    onSelectAll,
    onDeselectAll,
    onNextItem,
    onPrevItem,
    onOpenSelected,
    onToggleSelection,
    onEscape,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (navTimeout.current) {
        clearTimeout(navTimeout.current);
      }
    };
  }, [handleKeyDown]);

  return {
    pendingNav: pendingNav.current,
  };
}

// Hook for modal-specific shortcuts
export function useModalShortcuts(options: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}) {
  const { isOpen, onClose, onSubmit } = options;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey } = event;
      const modKey = metaKey || ctrlKey;

      // Escape - Close modal
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      // Cmd/Ctrl+Enter - Submit
      if (modKey && key === 'Enter') {
        if (onSubmit) {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, onSubmit]);
}
