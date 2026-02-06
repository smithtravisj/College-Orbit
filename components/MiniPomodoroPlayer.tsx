'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, X, Timer, Coffee } from 'lucide-react';
import { usePomodoroContext } from '@/context/PomodoroContext';
import { useRouter } from 'next/navigation';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'pomodoroMiniPosition';
const DEFAULT_BOTTOM = 90;
const DEFAULT_RIGHT = 20;

export default function MiniPomodoroPlayer() {
  const router = useRouter();
  const {
    timeLeft,
    isRunning,
    isWorkSession,
    toggle,
    dismissMiniPlayer,
  } = usePomodoroContext();

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  // Load saved position from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      }
    } catch (error) {
      console.error('Failed to load mini player position:', error);
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (position && !isDragging) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [position, isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasDragged.current = false;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  }, []);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      // Calculate new position (as left/top from viewport edges)
      const newX = clientX - dragOffset.current.x;
      const newY = clientY - dragOffset.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;

      // Mark that we've actually moved
      hasDragged.current = true;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse/touch move and up listeners
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  const handleClick = () => {
    // Don't navigate if we dragged
    if (hasDragged.current) return;

    // Navigate to tools page and switch to productivity tab
    localStorage.setItem('toolsTab', 'productivity');
    router.push('/tools');
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissMiniPlayer();
  };

  // Position styles - use saved position or default to bottom-right
  const positionStyles: React.CSSProperties = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        right: `calc(${DEFAULT_RIGHT}px + env(safe-area-inset-right))`,
        bottom: `calc(${DEFAULT_BOTTOM}px + env(safe-area-inset-bottom))`,
      };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={handleClick}
      style={{
        position: 'fixed',
        ...positionStyles,
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1001,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Session type icon */}
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isWorkSession ? 'var(--link)' : 'var(--success, #6bc96b)',
      }}>
        {isWorkSession ? <Timer size={16} /> : <Coffee size={16} />}
      </span>

      {/* Time display */}
      <span
        style={{
          fontSize: '16px',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: isWorkSession ? 'var(--link)' : 'var(--success, #6bc96b)',
          minWidth: '52px',
        }}
      >
        {formatTime(timeLeft)}
      </span>

      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: isRunning ? 'rgba(230, 57, 70, 0.15)' : 'rgba(var(--link-rgb, 139, 92, 246), 0.15)',
          color: isRunning ? '#e63946' : 'var(--link)',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Session type label */}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {isWorkSession ? 'Work' : 'Break'}
      </span>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          marginLeft: '2px',
          transition: 'color 0.15s, background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
