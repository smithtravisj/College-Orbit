'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number | null; height: number | null }>;
  };
  duration: number;
  uri: string;
  externalUrl: string;
}

export interface SpotifyUser {
  id: string;
  name: string;
  image: string | null;
  product: 'premium' | 'free' | 'open';
}

interface SpotifyContextType {
  // Connection state
  isConnected: boolean;
  isPremium: boolean;
  userProfile: SpotifyUser | null;
  isLoading: boolean;

  // Playback state
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  position: number;
  duration: number;

  // Visualizer
  visualizerBars: number[];

  // Mini player state
  isMiniPlayerVisible: boolean;
  isMiniPlayerDismissed: boolean;
  miniPlayerSize: 'big' | 'medium' | 'mini';

  // Actions
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;

  // Mini player controls
  dismissMiniPlayer: () => void;
  showMiniPlayer: () => void;
  setMiniPlayerSize: (size: 'big' | 'medium' | 'mini') => void;

  // Error state
  lastError: string | null;
  clearError: () => void;

  // Refresh connection status
  refreshStatus: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

const STORAGE_KEY_SIZE = 'spotifyMiniPlayerSize';
const STORAGE_KEY_DISMISSED = 'spotifyMiniPlayerDismissed';

export function SpotifyProvider({ children }: { children: ReactNode }) {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userProfile, setUserProfile] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Visualizer
  const [visualizerBars, setVisualizerBars] = useState<number[]>([0.15, 0.15, 0.15, 0.15]);

  // Mini player state
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const [miniPlayerSize, setMiniPlayerSizeState] = useState<'big' | 'medium' | 'mini'>('medium');

  // Error state
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem(STORAGE_KEY_SIZE);
      if (savedSize && ['big', 'medium', 'mini'].includes(savedSize)) {
        setMiniPlayerSizeState(savedSize as 'big' | 'medium' | 'mini');
      }

      const savedDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
      if (savedDismissed === 'true') {
        setIsMiniPlayerDismissed(true);
      }
    } catch (error) {
      console.error('Failed to load Spotify preferences:', error);
    }
  }, []);

  // Generate visualizer bars with organic, music-like movement
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerBars([0.15, 0.15, 0.15, 0.15]);
      return;
    }

    // Random seed offsets per bar so they move independently
    const offsets = [0, 1.7, 3.4, 5.1];
    let prev = [0.5, 0.5, 0.5, 0.5];

    const interval = setInterval(() => {
      const t = Date.now() / 1000;
      const bars = offsets.map((offset, i) => {
        // Layer multiple sine waves at different speeds for organic feel
        const wave1 = Math.sin(t * 3.2 + offset) * 0.3;
        const wave2 = Math.sin(t * 5.7 + offset * 2.3) * 0.25;
        const wave3 = Math.sin(t * 1.4 + offset * 0.7) * 0.15;
        // Add random jitter
        const jitter = (Math.random() - 0.5) * 0.2;
        const raw = 0.45 + wave1 + wave2 + wave3 + jitter;
        // Smooth toward target to avoid jumps
        const smoothed = prev[i] * 0.3 + raw * 0.7;
        return Math.max(0.1, Math.min(1, smoothed));
      });
      prev = bars;
      setVisualizerBars(bars);
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Interpolate position between polls
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
      return;
    }

    positionIntervalRef.current = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1000, duration));
    }, 1000);

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [isPlaying, currentTrack, duration]);

  // Fetch connection status
  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/spotify/status');
      if (!response.ok) {
        setIsConnected(false);
        setUserProfile(null);
        return;
      }

      const data = await response.json();

      if (data.connected) {
        setIsConnected(true);
        setUserProfile(data.user);
        setIsPremium(data.user?.product === 'premium');
        if (data.preferences?.miniPlayerSize) {
          setMiniPlayerSizeState(data.preferences.miniPlayerSize);
        }
      } else {
        setIsConnected(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch Spotify status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch playback state
  const fetchPlaybackState = useCallback(async () => {
    if (!isConnected) return;

    try {
      const response = await fetch('/api/spotify/playback');

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshResponse = await fetch('/api/spotify/refresh', { method: 'POST' });
          if (!refreshResponse.ok) {
            setIsConnected(false);
            return;
          }
          // Retry playback fetch
          const retryResponse = await fetch('/api/spotify/playback');
          if (!retryResponse.ok) return;
          const data = await retryResponse.json();
          updatePlaybackState(data);
          return;
        }
        return;
      }

      const data = await response.json();
      updatePlaybackState(data);
    } catch (error) {
      console.error('Failed to fetch playback state:', error);
    }
  }, [isConnected]);

  const updatePlaybackState = (data: {
    isPlaying: boolean;
    track: SpotifyTrack | null;
    position: number;
    duration: number;
    isPremium: boolean;
  }) => {
    setIsPlaying(data.isPlaying);
    setCurrentTrack(data.track);
    setPosition(data.position);
    setDuration(data.duration);
    setIsPremium(data.isPremium);

    // Auto-show mini player when a new track starts
    if (data.track && data.track.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = data.track.id;
      setIsMiniPlayerDismissed(false);
      localStorage.setItem(STORAGE_KEY_DISMISSED, 'false');
    }
  };

  // Initial status fetch
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Start polling when connected
  useEffect(() => {
    if (!isConnected) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Fetch immediately
    fetchPlaybackState();

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(fetchPlaybackState, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, fetchPlaybackState]);

  // Pause polling when document is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (isConnected) {
        fetchPlaybackState();
        pollingIntervalRef.current = setInterval(fetchPlaybackState, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, fetchPlaybackState]);

  // Playback control actions
  const controlPlayback = async (action: string) => {
    if (!isPremium) {
      setLastError('Playback control requires Spotify Premium');
      return;
    }

    // Optimistically update state immediately
    if (action === 'play') setIsPlaying(true);
    if (action === 'pause') setIsPlaying(false);

    try {
      const response = await fetch('/api/spotify/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Don't show token-related errors as playback errors
        if (data.needsRefresh) {
          await fetch('/api/spotify/refresh', { method: 'POST' });
          return;
        }
        console.warn('Playback control response:', data.error);
      }

      // Fetch actual state after a short delay to confirm
      setTimeout(fetchPlaybackState, 500);
    } catch (error) {
      console.error('Playback control error:', error);
      // Revert optimistic update
      if (action === 'play') setIsPlaying(false);
      if (action === 'pause') setIsPlaying(true);
      setLastError('Failed to control playback');
    }
  };

  const play = useCallback(() => controlPlayback('play'), [isPremium, fetchPlaybackState]);
  const pause = useCallback(() => controlPlayback('pause'), [isPremium, fetchPlaybackState]);
  const toggle = useCallback(() => controlPlayback(isPlaying ? 'pause' : 'play'), [isPlaying, isPremium, fetchPlaybackState]);
  const skipNext = useCallback(() => controlPlayback('next'), [isPremium, fetchPlaybackState]);
  const skipPrevious = useCallback(() => controlPlayback('previous'), [isPremium, fetchPlaybackState]);

  // Mini player controls
  const dismissMiniPlayer = useCallback(() => {
    setIsMiniPlayerDismissed(true);
    localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
  }, []);

  const showMiniPlayer = useCallback(() => {
    setIsMiniPlayerDismissed(false);
    localStorage.setItem(STORAGE_KEY_DISMISSED, 'false');
  }, []);

  const setMiniPlayerSize = useCallback((size: 'big' | 'medium' | 'mini') => {
    setMiniPlayerSizeState(size);
    localStorage.setItem(STORAGE_KEY_SIZE, size);
    // Also update on server
    fetch('/api/spotify/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ miniPlayerSize: size }),
    }).catch(console.error);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  // Compute if mini player should be visible
  const isMiniPlayerVisible = isConnected && currentTrack !== null && !isMiniPlayerDismissed;

  return (
    <SpotifyContext.Provider
      value={{
        isConnected,
        isPremium,
        userProfile,
        isLoading,
        isPlaying,
        currentTrack,
        position,
        duration,
        visualizerBars,
        isMiniPlayerVisible,
        isMiniPlayerDismissed,
        miniPlayerSize,
        play,
        pause,
        toggle,
        skipNext,
        skipPrevious,
        dismissMiniPlayer,
        showMiniPlayer,
        setMiniPlayerSize,
        lastError,
        clearError,
        refreshStatus,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotifyContext() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotifyContext must be used within SpotifyProvider');
  }
  return context;
}
