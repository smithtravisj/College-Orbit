'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Minimize2, Maximize2, ExternalLink } from 'lucide-react';
import { useSpotifyContext } from '@/context/SpotifyContext';
import { SpotifyVisualizer } from './SpotifyVisualizer';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'spotifyMiniPosition';
const DEFAULT_BOTTOM = 90;
const DEFAULT_RIGHT = 20;

export default function MiniSpotifyPlayer() {
  const {
    isPlaying,
    currentTrack,
    position,
    duration,
    isPremium,
    isMiniPlayerVisible,
    miniPlayerSize,
    toggle,
    skipNext,
    skipPrevious,
    dismissMiniPlayer,
    setMiniPlayerSize,
    lastError,
    clearError,
  } = useSpotifyContext();

  const [playerPosition, setPlayerPosition] = useState<Position | null>(null);
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
        setPlayerPosition(parsed);
      }
    } catch (error) {
      console.error('Failed to load Spotify mini player position:', error);
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (playerPosition && !isDragging) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerPosition));
    }
  }, [playerPosition, isDragging]);

  // Auto-clear errors after 3 seconds
  useEffect(() => {
    if (!lastError) return;
    const timeout = setTimeout(clearError, 3000);
    return () => clearTimeout(timeout);
  }, [lastError, clearError]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      const newX = clientX - dragOffset.current.x;
      const newY = clientY - dragOffset.current.y;

      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;

      hasDragged.current = true;

      setPlayerPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  const handleOpenSpotify = () => {
    if (hasDragged.current) return;
    if (currentTrack?.externalUrl) {
      window.open(currentTrack.externalUrl, '_blank');
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPremium) {
      toggle();
    }
  };

  const handleSkipNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPremium) {
      skipNext();
    }
  };

  const handleSkipPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPremium) {
      skipPrevious();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissMiniPlayer();
  };

  const handleSizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sizes: Array<'big' | 'medium' | 'mini'> = ['big', 'medium', 'mini'];
    const currentIndex = sizes.indexOf(miniPlayerSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setMiniPlayerSize(sizes[nextIndex]);
  };

  if (!isMiniPlayerVisible || !currentTrack) {
    return null;
  }

  const positionStyles: React.CSSProperties = playerPosition
    ? {
        left: playerPosition.x,
        top: playerPosition.y,
        right: 'auto',
        bottom: 'auto',
      }
    : {
        right: `calc(${DEFAULT_RIGHT}px + env(safe-area-inset-right))`,
        bottom: `calc(${DEFAULT_BOTTOM}px + env(safe-area-inset-bottom))`,
      };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles,
    backgroundColor: 'var(--panel-solid, var(--panel))',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1001,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  const buttonStyle = (disabled?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: disabled ? 'var(--text-muted)' : '#1DB954',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s, background-color 0.15s',
  });

  // Render based on size
  if (miniPlayerSize === 'mini') {
    return (
      <div
        ref={containerRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={handleOpenSpotify}
        style={{
          ...baseStyles,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '280px',
        }}
      >
        <SpotifyVisualizer size="small" />

        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {currentTrack.name}
        </span>

        <button
          onClick={handlePlayPause}
          title={isPremium ? (isPlaying ? 'Pause' : 'Play') : 'Requires Spotify Premium'}
          style={{ ...buttonStyle(!isPremium), width: '28px', height: '28px' }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={handleSizeToggle}
          title="Change size"
          style={{ ...buttonStyle(), width: '24px', height: '24px', color: 'var(--text-muted)' }}
        >
          <Maximize2 size={12} />
        </button>

        <button
          onClick={handleClose}
          title="Close"
          style={{ ...buttonStyle(), width: '24px', height: '24px', color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (miniPlayerSize === 'medium') {
    return (
      <div
        ref={containerRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={handleOpenSpotify}
        style={{
          ...baseStyles,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '240px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentTrack.album.images[0] && (
            <Image
              src={currentTrack.album.images[0].url}
              alt={currentTrack.album.name}
              width={48}
              height={48}
              style={{ borderRadius: '6px', flexShrink: 0 }}
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentTrack.name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentTrack.artists.map((a) => a.name).join(', ')}
            </div>
          </div>

          <SpotifyVisualizer size="medium" />
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '32px' }}>
            {formatTime(position)}
          </span>
          <div
            style={{
              flex: 1,
              height: '3px',
              backgroundColor: 'var(--border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: '#1DB954',
                transition: 'width 1s linear',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handlePlayPause}
              title={isPremium ? (isPlaying ? 'Pause' : 'Play') : 'Requires Spotify Premium'}
              style={{ ...buttonStyle(!isPremium), width: '32px', height: '32px' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={handleSkipNext}
              title={isPremium ? 'Next' : 'Requires Spotify Premium'}
              style={{ ...buttonStyle(!isPremium), width: '28px', height: '28px' }}
            >
              <SkipForward size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!isPremium && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentTrack?.externalUrl) {
                    window.open(currentTrack.externalUrl, '_blank');
                  }
                }}
                title="Open in Spotify"
                style={{ ...buttonStyle(), width: '24px', height: '24px', color: '#1DB954' }}
              >
                <ExternalLink size={12} />
              </button>
            )}
            <button
              onClick={handleSizeToggle}
              title="Change size"
              style={{ ...buttonStyle(), width: '24px', height: '24px', color: 'var(--text-muted)' }}
            >
              <Minimize2 size={12} />
            </button>
            <button
              onClick={handleClose}
              title="Close"
              style={{ ...buttonStyle(), width: '24px', height: '24px', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Big size
  return (
    <div
      ref={containerRef}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={handleOpenSpotify}
      style={{
        ...baseStyles,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '300px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {currentTrack.album.images[0] && (
          <Image
            src={currentTrack.album.images[0].url}
            alt={currentTrack.album.name}
            width={80}
            height={80}
            style={{ borderRadius: '8px', flexShrink: 0 }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {currentTrack.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentTrack.artists.map((a) => a.name).join(', ')}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px',
            }}
          >
            {currentTrack.album.name}
          </div>
        </div>

        <SpotifyVisualizer size="large" />
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px' }}>
          {formatTime(position)}
        </span>
        <div
          style={{
            flex: 1,
            height: '4px',
            backgroundColor: 'var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#1DB954',
              transition: 'width 1s linear',
            }}
          />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSkipPrevious}
            title={isPremium ? 'Previous' : 'Requires Spotify Premium'}
            style={{ ...buttonStyle(!isPremium), width: '32px', height: '32px' }}
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={handlePlayPause}
            title={isPremium ? (isPlaying ? 'Pause' : 'Play') : 'Requires Spotify Premium'}
            style={{
              ...buttonStyle(!isPremium),
              width: '40px',
              height: '40px',
              backgroundColor: isPremium ? '#1DB954' : 'var(--border)',
              color: isPremium ? '#fff' : 'var(--text-muted)',
              borderRadius: '50%',
            }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={handleSkipNext}
            title={isPremium ? 'Next' : 'Requires Spotify Premium'}
            style={{ ...buttonStyle(!isPremium), width: '32px', height: '32px' }}
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isPremium && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentTrack?.externalUrl) {
                  window.open(currentTrack.externalUrl, '_blank');
                }
              }}
              title="Open in Spotify"
              style={{ ...buttonStyle(), width: '28px', height: '28px', color: '#1DB954' }}
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={handleSizeToggle}
            title="Change size"
            style={{ ...buttonStyle(), width: '28px', height: '28px', color: 'var(--text-muted)' }}
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={handleClose}
            title="Close"
            style={{ ...buttonStyle(), width: '28px', height: '28px', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {lastError && (
        <div
          style={{
            fontSize: '11px',
            color: '#e63946',
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            borderRadius: '4px',
          }}
        >
          {lastError}
        </div>
      )}
    </div>
  );
}
