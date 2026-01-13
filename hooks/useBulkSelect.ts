import { useState, useCallback, useRef } from 'react';

interface UseBulkSelectOptions {
  longPressDelay?: number;
}

interface UseBulkSelectReturn {
  selectedIds: Set<string>;
  isSelecting: boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  startSelecting: (id?: string) => void;
  stopSelecting: () => void;
  isSelected: (id: string) => boolean;
  handleLongPressStart: (id: string) => void;
  handleLongPressEnd: () => void;
  handleContextMenu: (e: React.MouseEvent, id: string) => void;
  handleItemClick: (id: string, originalHandler?: () => void) => void;
}

export function useBulkSelect(options: UseBulkSelectOptions = {}): UseBulkSelectReturn {
  const { longPressDelay = 500 } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const startSelecting = useCallback((id?: string) => {
    setIsSelecting(true);
    if (id) {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const stopSelecting = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // Exit selection mode if no items are selected
      if (newSet.size === 0) {
        setIsSelecting(false);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const handleLongPressStart = useCallback((id: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      startSelecting(id);
    }, longPressDelay);
  }, [longPressDelay, startSelecting]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!isSelecting) {
      startSelecting(id);
    } else {
      toggleSelection(id);
    }
  }, [isSelecting, startSelecting, toggleSelection]);

  const handleItemClick = useCallback((id: string, originalHandler?: () => void) => {
    // If long press was triggered, don't do anything on click
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (isSelecting) {
      toggleSelection(id);
    } else if (originalHandler) {
      originalHandler();
    }
  }, [isSelecting, toggleSelection]);

  return {
    selectedIds,
    isSelecting,
    toggleSelection,
    selectAll,
    clearSelection,
    startSelecting,
    stopSelecting,
    isSelected,
    handleLongPressStart,
    handleLongPressEnd,
    handleContextMenu,
    handleItemClick,
  };
}
