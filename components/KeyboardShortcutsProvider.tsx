'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

interface KeyboardShortcutsContextType {
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
  openQuickAdd: () => void;
  setQuickAddHandler: (handler: () => void) => void;
  focusSearch: () => void;
  setSearchHandler: (handler: (() => void) | null) => void;
  triggerNewItem: () => void;
  setNewItemHandler: (handler: (() => void) | null) => void;
  triggerSubmit: () => void;
  setSubmitHandler: (handler: (() => void) | null) => void;
  triggerDelete: () => void;
  setDeleteHandler: (handler: (() => void) | null) => void;
  triggerSelectAll: () => void;
  setSelectAllHandler: (handler: (() => void) | null) => void;
  triggerDeselectAll: () => void;
  setDeselectAllHandler: (handler: (() => void) | null) => void;
  setEscapeHandler: (handler: (() => void) | null) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export default function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [quickAddHandler, setQuickAddHandlerState] = useState<(() => void) | null>(null);
  const [searchHandler, setSearchHandlerState] = useState<(() => void) | null>(null);
  const [newItemHandler, setNewItemHandlerState] = useState<(() => void) | null>(null);
  const [submitHandler, setSubmitHandlerState] = useState<(() => void) | null>(null);
  const [deleteHandler, setDeleteHandlerState] = useState<(() => void) | null>(null);
  const [selectAllHandler, setSelectAllHandlerState] = useState<(() => void) | null>(null);
  const [deselectAllHandler, setDeselectAllHandlerState] = useState<(() => void) | null>(null);
  const [escapeHandler, setEscapeHandlerState] = useState<(() => void) | null>(null);

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  const openQuickAdd = useCallback(() => {
    if (quickAddHandler) quickAddHandler();
  }, [quickAddHandler]);

  const focusSearch = useCallback(() => {
    if (searchHandler) searchHandler();
  }, [searchHandler]);

  const triggerNewItem = useCallback(() => {
    if (newItemHandler) newItemHandler();
  }, [newItemHandler]);

  const triggerSubmit = useCallback(() => {
    if (submitHandler) submitHandler();
  }, [submitHandler]);

  const triggerDelete = useCallback(() => {
    if (deleteHandler) deleteHandler();
  }, [deleteHandler]);

  const triggerSelectAll = useCallback(() => {
    if (selectAllHandler) selectAllHandler();
  }, [selectAllHandler]);

  const triggerDeselectAll = useCallback(() => {
    if (deselectAllHandler) deselectAllHandler();
  }, [deselectAllHandler]);

  const triggerEscape = useCallback(() => {
    // First close help if open
    if (isHelpOpen) {
      setIsHelpOpen(false);
      return;
    }
    // Otherwise call the escape handler
    if (escapeHandler) escapeHandler();
  }, [isHelpOpen, escapeHandler]);

  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    onQuickAdd: openQuickAdd,
    onShowHelp: showHelp,
    onSearch: focusSearch,
    onNewItem: triggerNewItem,
    onSubmit: triggerSubmit,
    onDelete: triggerDelete,
    onSelectAll: triggerSelectAll,
    onDeselectAll: triggerDeselectAll,
    onEscape: triggerEscape,
    disabled: false,
  });

  const value: KeyboardShortcutsContextType = {
    showHelp,
    hideHelp,
    isHelpOpen,
    openQuickAdd,
    setQuickAddHandler: (handler) => setQuickAddHandlerState(() => handler),
    focusSearch,
    setSearchHandler: (handler) => setSearchHandlerState(() => handler),
    triggerNewItem,
    setNewItemHandler: (handler) => setNewItemHandlerState(() => handler),
    triggerSubmit,
    setSubmitHandler: (handler) => setSubmitHandlerState(() => handler),
    triggerDelete,
    setDeleteHandler: (handler) => setDeleteHandlerState(() => handler),
    triggerSelectAll,
    setSelectAllHandler: (handler) => setSelectAllHandlerState(() => handler),
    triggerDeselectAll,
    setDeselectAllHandler: (handler) => setDeselectAllHandlerState(() => handler),
    setEscapeHandler: (handler) => setEscapeHandlerState(() => handler),
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsModal isOpen={isHelpOpen} onClose={hideHelp} />
    </KeyboardShortcutsContext.Provider>
  );
}
