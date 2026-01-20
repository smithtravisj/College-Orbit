'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Undo2 } from 'lucide-react';

interface DeleteToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number; // milliseconds
}

export function DeleteToast({ message, onUndo, onDismiss, duration = 5000 }: DeleteToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const handleUndo = useCallback(() => {
    setIsVisible(false);
    onUndo();
  }, [onUndo]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss();
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
        maxWidth: '400px',
        position: 'relative',
      }}
    >
      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text)' }}>
        {message}
      </span>
      <button
        onClick={handleUndo}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--link)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Undo2 size={14} />
        Undo
      </button>
      <button
        onClick={handleDismiss}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          color: 'var(--text-muted)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={16} />
      </button>
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--accent)',
            transition: 'width 50ms linear',
          }}
        />
      </div>
    </div>
  );
}

// Hook to manage delete toasts - supports multiple simultaneous toasts
interface DeleteToastState {
  id: string;
  message: string;
  onUndo: () => void;
}

let toastListeners: ((toasts: DeleteToastState[]) => void)[] = [];
let currentToasts: DeleteToastState[] = [];

const MAX_TOASTS = 3;

export function showDeleteToast(message: string, onUndo: () => void): string {
  const id = Math.random().toString(36).substring(7);
  const newToast = { id, message, onUndo };

  // If we're at max capacity, remove the oldest toast (don't call its undo)
  if (currentToasts.length >= MAX_TOASTS) {
    currentToasts = currentToasts.slice(1);
  }

  currentToasts = [...currentToasts, newToast];
  toastListeners.forEach(listener => listener(currentToasts));
  return id;
}

export function hideDeleteToast(id?: string) {
  if (id) {
    currentToasts = currentToasts.filter(t => t.id !== id);
  } else {
    currentToasts = [];
  }
  toastListeners.forEach(listener => listener(currentToasts));
}

export function useDeleteToast() {
  const [toasts, setToasts] = useState<DeleteToastState[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    // Get current toasts if any
    if (currentToasts.length > 0) {
      setToasts(currentToasts);
    }
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  return toasts;
}
