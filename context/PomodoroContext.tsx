'use client';

import { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useCallback, ReactNode } from 'react';
import useAppStore from '@/lib/store';
import { AmbientSoundEngine, AmbientSoundType } from '@/lib/ambientSoundEngine';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

interface PomodoroContextType {
  // Timer state
  timeLeft: number;
  isRunning: boolean;
  isWorkSession: boolean;
  workDuration: number;
  breakDuration: number;
  sessionsCompleted: number;
  totalWorkTime: number;
  totalBreakTime: number;
  isMuted: boolean;
  hasActiveSession: boolean;

  // Ambient sound state
  ambientSound: AmbientSoundType | null;
  ambientVolume: number;
  ambientAutoPlay: boolean;
  isAmbientPlaying: boolean;

  // Actions
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setWorkDuration: (mins: number) => void;
  setBreakDuration: (mins: number) => void;
  setIsMuted: (muted: boolean) => void;
  applySettings: (workMins: number, breakMins: number, muted: boolean) => void;
  setAmbientSound: (sound: AmbientSoundType | null) => void;
  setAmbientVolume: (volume: number) => void;
  setAmbientAutoPlay: (auto: boolean) => void;
  toggleAmbientSound: () => void;

  // Mini player state
  isMiniPlayerDismissed: boolean;
  dismissMiniPlayer: () => void;
  showMiniPlayer: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useAppStore();
  const [workDuration, setWorkDurationState] = useState(settings?.pomodoroWorkDuration || 25);
  const [breakDuration, setBreakDurationState] = useState(settings?.pomodoroBreakDuration || 5);
  const [timeLeft, setTimeLeft] = useState((settings?.pomodoroWorkDuration || 25) * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [isMuted, setIsMutedState] = useState(settings?.pomodoroIsMuted || false);
  const [hasRestored, setHasRestored] = useState(false);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Ambient sound state
  const [ambientSound, setAmbientSoundState] = useState<AmbientSoundType | null>(
    (settings?.pomodoroAmbientSound as AmbientSoundType) || null
  );
  const [ambientVolume, setAmbientVolumeState] = useState(settings?.pomodoroAmbientVolume ?? 0.5);
  const [ambientAutoPlay, setAmbientAutoPlayState] = useState(settings?.pomodoroAmbientAutoPlay ?? true);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  const ambientEngineRef = useRef<AmbientSoundEngine | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastMinuteCountedRef = useRef(0);

  // Restore timer state from localStorage on mount
  useLayoutEffect(() => {
    try {
      const savedState = localStorage.getItem('pomodoroState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setWorkDurationState(state.workDuration || 25);
        setBreakDurationState(state.breakDuration || 5);
        setTimeLeft(state.timeLeft || (state.workDuration || 25) * 60);
        setIsRunning(state.isRunning || false);
        setIsWorkSession(state.isWorkSession !== false);
        setSessionsCompleted(state.sessionsCompleted || 0);
        setTotalWorkTime(state.totalWorkTime || 0);
        setTotalBreakTime(state.totalBreakTime || 0);
        setHasActiveSession(state.hasActiveSession || false);
        setIsMiniPlayerDismissed(state.isMiniPlayerDismissed || false);
        if (state.ambientSound) setAmbientSoundState(state.ambientSound);
        if (state.ambientVolume !== undefined) setAmbientVolumeState(state.ambientVolume);
        if (state.ambientAutoPlay !== undefined) setAmbientAutoPlayState(state.ambientAutoPlay);

        // Restore session timing if timer was running
        if (state.isRunning && state.sessionStartTime) {
          const elapsedSeconds = Math.floor((Date.now() - state.sessionStartTime) / 1000);
          const sessionDuration = state.isWorkSession ? state.workDuration * 60 : state.breakDuration * 60;
          const newTimeLeft = Math.max(0, sessionDuration - elapsedSeconds);
          setTimeLeft(newTimeLeft);
          sessionStartTimeRef.current = Date.now() - (sessionDuration - newTimeLeft) * 1000;
          lastMinuteCountedRef.current = Math.floor((sessionDuration - newTimeLeft) / 60);
        }
      }
    } catch (error) {
      console.error('Failed to restore timer state:', error);
    }
  }, []);

  // Signal that restore is complete
  useEffect(() => {
    setHasRestored(true);
  }, []);

  // Sync durations and mute setting from store to local state
  useEffect(() => {
    if (settings?.pomodoroWorkDuration) setWorkDurationState(settings.pomodoroWorkDuration);
    if (settings?.pomodoroBreakDuration) setBreakDurationState(settings.pomodoroBreakDuration);
    if (settings?.pomodoroIsMuted !== undefined) setIsMutedState(settings.pomodoroIsMuted);
    if (settings?.pomodoroAmbientSound !== undefined) setAmbientSoundState(settings.pomodoroAmbientSound as AmbientSoundType | null);
    if (settings?.pomodoroAmbientVolume !== undefined) setAmbientVolumeState(settings.pomodoroAmbientVolume);
    if (settings?.pomodoroAmbientAutoPlay !== undefined) setAmbientAutoPlayState(settings.pomodoroAmbientAutoPlay);
  }, [settings?.pomodoroWorkDuration, settings?.pomodoroBreakDuration, settings?.pomodoroIsMuted, settings?.pomodoroAmbientSound, settings?.pomodoroAmbientVolume, settings?.pomodoroAmbientAutoPlay]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (!hasRestored) return;

    const state = {
      workDuration,
      breakDuration,
      timeLeft,
      isRunning,
      isWorkSession,
      sessionsCompleted,
      totalWorkTime,
      totalBreakTime,
      hasActiveSession,
      isMiniPlayerDismissed,
      sessionStartTime: sessionStartTimeRef.current,
      ambientSound,
      ambientVolume,
      ambientAutoPlay,
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [hasRestored, workDuration, breakDuration, timeLeft, isRunning, isWorkSession, sessionsCompleted, totalWorkTime, totalBreakTime, hasActiveSession, isMiniPlayerDismissed, ambientSound, ambientVolume, ambientAutoPlay]);

  // Debounced function to save timer settings to database
  const savePomodoroSettings = useRef(
    debounce(
      (work: number, breakDur: number, muted: boolean, ambSound?: string | null, ambVol?: number, ambAuto?: boolean) => {
        const update: Record<string, any> = {
          pomodoroWorkDuration: work,
          pomodoroBreakDuration: breakDur,
          pomodoroIsMuted: muted,
        };
        if (ambSound !== undefined) update.pomodoroAmbientSound = ambSound;
        if (ambVol !== undefined) update.pomodoroAmbientVolume = ambVol;
        if (ambAuto !== undefined) update.pomodoroAmbientAutoPlay = ambAuto;
        updateSettings(update).catch((error) => {
          console.error('Error saving Pomodoro settings:', error);
        });
      },
      1000
    )
  ).current;

  const playNotification = useCallback(() => {
    if (isMuted) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      const layer1Volume = 0.30;
      const layer2Volume = layer1Volume * Math.pow(10, -12 / 20);
      const layer3Volume = layer1Volume * Math.pow(10, -22 / 20);
      const layer4Volume = layer1Volume * Math.pow(10, -30 / 20);
      const layer5Volume = layer1Volume * Math.pow(10, -26 / 20);

      const notes = [
        { frequency: 587, duration: 0.30, dynamics: 0.58, gap: 0.08 },
        { frequency: 659, duration: 0.30, dynamics: 0.60, gap: 0.08 },
        { frequency: 880, duration: 0.60, dynamics: 0.62, gap: 0.00 },
      ];

      let currentTime = now;

      notes.forEach((note) => {
        const noteStart = currentTime;
        const noteDuration = note.duration;
        const noteEnd = noteStart + noteDuration;
        const velocity = note.dynamics;

        // Layer 1: Core (pure sine)
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = note.frequency;
        osc1.type = 'sine';

        const attack1 = 0.012;
        const release1 = 0.220;
        const releaseStart1 = Math.max(noteStart + attack1, noteEnd - release1);
        gain1.gain.setValueAtTime(0, noteStart);
        gain1.gain.linearRampToValueAtTime(layer1Volume * velocity, noteStart + attack1);
        gain1.gain.setValueAtTime(layer1Volume * velocity, releaseStart1);
        gain1.gain.exponentialRampToValueAtTime(0.001, noteEnd);
        osc1.start(noteStart);
        osc1.stop(noteEnd);

        // Layer 2: Soft body (sine one octave below)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = note.frequency / 2;
        osc2.type = 'sine';

        const attack2 = 0.024;
        const release2 = 0.360;
        const sustain2 = 0.85;
        const releaseStart2 = Math.max(noteStart + attack2, noteEnd - release2);
        gain2.gain.setValueAtTime(0, noteStart);
        gain2.gain.linearRampToValueAtTime(layer2Volume * velocity * sustain2, noteStart + attack2);
        gain2.gain.setValueAtTime(layer2Volume * velocity * sustain2, releaseStart2);
        gain2.gain.linearRampToValueAtTime(0.001, noteEnd);
        osc2.start(noteStart);
        osc2.stop(noteEnd);

        // Layer 3: Deep floor (sine two octaves below)
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = note.frequency / 4;
        osc3.type = 'sine';

        const attack3 = 0.040;
        const release3 = 0.520;
        const sustain3 = 0.70;
        const releaseStart3 = Math.max(noteStart + attack3, noteEnd - release3);
        gain3.gain.setValueAtTime(0, noteStart);
        gain3.gain.linearRampToValueAtTime(layer3Volume * velocity * sustain3, noteStart + attack3);
        gain3.gain.setValueAtTime(layer3Volume * velocity * sustain3, releaseStart3);
        gain3.gain.linearRampToValueAtTime(0.001, noteEnd);
        osc3.start(noteStart);
        osc3.stop(noteEnd);

        // Layer 4: Air cushion (sine one octave above)
        const osc4 = audioContext.createOscillator();
        const gain4 = audioContext.createGain();
        osc4.connect(gain4);
        gain4.connect(audioContext.destination);
        osc4.frequency.value = note.frequency * 2;
        osc4.type = 'sine';

        const attack4 = 0.032;
        const release4 = 0.180;
        const sustain4 = 0.40;
        const releaseStart4 = Math.max(noteStart + attack4, noteEnd - release4);
        gain4.gain.setValueAtTime(0, noteStart);
        gain4.gain.linearRampToValueAtTime(layer4Volume * velocity * sustain4, noteStart + attack4);
        gain4.gain.setValueAtTime(layer4Volume * velocity * sustain4, releaseStart4);
        gain4.gain.linearRampToValueAtTime(0.001, noteEnd);
        osc4.start(noteStart);
        osc4.stop(noteEnd);

        // Layer 5: Soft blur (triangle at Layer 1 pitch)
        const osc5 = audioContext.createOscillator();
        const gain5 = audioContext.createGain();
        osc5.connect(gain5);
        gain5.connect(audioContext.destination);
        osc5.frequency.value = note.frequency;
        osc5.type = 'triangle';

        const attack5 = 0.060;
        const release5 = 0.420;
        const sustain5 = 0.50;
        const releaseStart5 = Math.max(noteStart + attack5, noteEnd - release5);
        gain5.gain.setValueAtTime(0, noteStart);
        gain5.gain.linearRampToValueAtTime(layer5Volume * velocity * sustain5, noteStart + attack5);
        gain5.gain.setValueAtTime(layer5Volume * velocity * sustain5, releaseStart5);
        gain5.gain.linearRampToValueAtTime(0.001, noteEnd);
        osc5.start(noteStart);
        osc5.stop(noteEnd);

        currentTime = noteEnd + note.gap;
      });
    } catch (error) {
      console.error('Failed to play notification:', error);
    }
  }, [isMuted]);

  // Initialize ambient engine
  useEffect(() => {
    ambientEngineRef.current = new AmbientSoundEngine();
    return () => {
      ambientEngineRef.current?.cleanup();
      ambientEngineRef.current = null;
    };
  }, []);

  // Sync volume to engine whenever it changes (including after restore)
  useEffect(() => {
    ambientEngineRef.current?.setVolume(ambientVolume);
  }, [ambientVolume]);

  // Resume ambient playback after restore — needs user gesture for AudioContext
  const hasResumedAmbientRef = useRef(false);
  useEffect(() => {
    if (hasResumedAmbientRef.current) return;

    // Read directly from localStorage since React state may not be settled yet
    let shouldPlay = false;
    let savedSound: AmbientSoundType | null = null;
    let savedVolume = 0.5;
    try {
      const raw = localStorage.getItem('pomodoroState');
      if (raw) {
        const state = JSON.parse(raw);
        shouldPlay = state.isRunning && (state.ambientAutoPlay ?? true) && !!state.ambientSound && !state.isMuted;
        savedSound = state.ambientSound || null;
        savedVolume = state.ambientVolume ?? 0.5;
      }
    } catch {
      // ignore
    }

    if (!shouldPlay || !savedSound) {
      hasResumedAmbientRef.current = true;
      return;
    }

    // Browser requires a user gesture to start AudioContext — listen for first interaction
    const resumeOnInteraction = () => {
      if (hasResumedAmbientRef.current) return;
      hasResumedAmbientRef.current = true;
      const engine = ambientEngineRef.current;
      if (engine) {
        engine.setVolume(savedVolume);
        engine.play(savedSound!);
        setIsAmbientPlaying(true);
      }
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('keydown', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
    };

    document.addEventListener('click', resumeOnInteraction);
    document.addEventListener('keydown', resumeOnInteraction);
    document.addEventListener('touchstart', resumeOnInteraction);

    return () => {
      document.removeEventListener('click', resumeOnInteraction);
      document.removeEventListener('keydown', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to start ambient playback
  const startAmbient = useCallback(() => {
    const engine = ambientEngineRef.current;
    if (!engine || !ambientSound || isMuted) return;
    engine.play(ambientSound);
    setIsAmbientPlaying(true);
  }, [ambientSound, isMuted]);

  // Helper to stop ambient playback
  const stopAmbient = useCallback(() => {
    const engine = ambientEngineRef.current;
    if (!engine) return;
    engine.stop();
    setIsAmbientPlaying(false);
  }, []);

  // Tab visibility: resume audio context on focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ambientEngineRef.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    // Set session start time when timer starts (or resumes after pause)
    if (sessionStartTimeRef.current === null) {
      const sessionDuration = isWorkSession ? workDuration * 60 : breakDuration * 60;
      const alreadyElapsed = sessionDuration - timeLeft;
      sessionStartTimeRef.current = Date.now() - (alreadyElapsed * 1000);
      lastMinuteCountedRef.current = Math.floor(alreadyElapsed / 60);
    }

    timerRef.current = setInterval(() => {
      if (sessionStartTimeRef.current !== null) {
        const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        const sessionDuration = isWorkSession ? workDuration * 60 : breakDuration * 60;
        const newTimeLeft = Math.max(0, sessionDuration - elapsedSeconds);

        // Calculate elapsed minutes and update counters for each new minute
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        if (elapsedMinutes > lastMinuteCountedRef.current) {
          const minutesCompleted = elapsedMinutes - lastMinuteCountedRef.current;
          if (isWorkSession) {
            setTotalWorkTime((t) => t + minutesCompleted);
          } else {
            setTotalBreakTime((t) => t + minutesCompleted);
          }
          lastMinuteCountedRef.current = elapsedMinutes;
        }

        if (newTimeLeft <= 0) {
          // Timer ended - show mini player for new session
          playNotification();
          setIsMiniPlayerDismissed(false);

          if (isWorkSession) {
            setSessionsCompleted((s) => s + 1);
            setIsWorkSession(false);
            sessionStartTimeRef.current = null;
            lastMinuteCountedRef.current = 0;
            setTimeLeft(breakDuration * 60);
          } else {
            setIsWorkSession(true);
            sessionStartTimeRef.current = null;
            lastMinuteCountedRef.current = 0;
            setTimeLeft(workDuration * 60);
          }
        } else {
          setTimeLeft(newTimeLeft);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, workDuration, breakDuration, isWorkSession, playNotification]);

  // Reset mini player dismissed state when session ends (reset is called)
  // Note: This is handled in the reset function now

  const start = useCallback(() => {
    setIsRunning(true);
    setHasActiveSession(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    sessionStartTimeRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (!isRunning) {
      // Starting/resuming the timer
      setIsRunning(true);
      setHasActiveSession(true);
      if (ambientAutoPlay && ambientSound && !isMuted) {
        startAmbient();
      }
    } else {
      // Pausing — null out start time so resume backdates correctly
      setIsRunning(false);
      sessionStartTimeRef.current = null;
      if (ambientAutoPlay) {
        stopAmbient();
      }
    }
  }, [isRunning, ambientAutoPlay, ambientSound, isMuted, startAmbient, stopAmbient]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeLeft(workDuration * 60);
    setSessionsCompleted(0);
    setTotalWorkTime(0);
    setTotalBreakTime(0);
    setHasActiveSession(false);
    setIsMiniPlayerDismissed(false);
    sessionStartTimeRef.current = null;
    lastMinuteCountedRef.current = 0;
    stopAmbient();
  }, [workDuration, stopAmbient]);

  const skip = useCallback(() => {
    if (isWorkSession) {
      setSessionsCompleted((s) => s + 1);
      setIsWorkSession(false);
      setTimeLeft(breakDuration * 60);
    } else {
      setIsWorkSession(true);
      setTimeLeft(workDuration * 60);
    }
    sessionStartTimeRef.current = null;
    lastMinuteCountedRef.current = 0;
    setIsRunning(false);
  }, [isWorkSession, workDuration, breakDuration]);

  const setWorkDuration = useCallback((mins: number) => {
    setWorkDurationState(mins);
  }, []);

  const setBreakDuration = useCallback((mins: number) => {
    setBreakDurationState(mins);
  }, []);

  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    savePomodoroSettings(workDuration, breakDuration, muted);
    if (muted) {
      stopAmbient();
    } else if (isRunning && ambientAutoPlay && ambientSound) {
      startAmbient();
    }
  }, [workDuration, breakDuration, savePomodoroSettings, stopAmbient, startAmbient, isRunning, ambientAutoPlay, ambientSound]);

  const applySettings = useCallback((workMins: number, breakMins: number, muted: boolean) => {
    setWorkDurationState(workMins);
    setBreakDurationState(breakMins);
    setTimeLeft(workMins * 60);
    setIsRunning(false);
    sessionStartTimeRef.current = null;
    lastMinuteCountedRef.current = 0;
    savePomodoroSettings(workMins, breakMins, muted);
  }, [savePomodoroSettings]);

  const setAmbientSound = useCallback((sound: AmbientSoundType | null) => {
    setAmbientSoundState(sound);
    if (!sound) {
      stopAmbient();
    } else if (isRunning && ambientAutoPlay && !isMuted) {
      const engine = ambientEngineRef.current;
      if (engine) {
        engine.play(sound);
        setIsAmbientPlaying(true);
      }
    }
    savePomodoroSettings(workDuration, breakDuration, isMuted, sound, undefined, undefined);
  }, [isRunning, ambientAutoPlay, isMuted, stopAmbient, savePomodoroSettings, workDuration, breakDuration]);

  const setAmbientVolume = useCallback((vol: number) => {
    setAmbientVolumeState(vol);
    ambientEngineRef.current?.setVolume(vol);
    savePomodoroSettings(workDuration, breakDuration, isMuted, undefined, vol, undefined);
  }, [savePomodoroSettings, workDuration, breakDuration, isMuted]);

  const setAmbientAutoPlay = useCallback((auto: boolean) => {
    setAmbientAutoPlayState(auto);
    savePomodoroSettings(workDuration, breakDuration, isMuted, undefined, undefined, auto);
  }, [savePomodoroSettings, workDuration, breakDuration, isMuted]);

  const toggleAmbientSound = useCallback(() => {
    if (isAmbientPlaying) {
      stopAmbient();
    } else if (ambientSound && !isMuted) {
      startAmbient();
    }
  }, [isAmbientPlaying, ambientSound, isMuted, startAmbient, stopAmbient]);

  const dismissMiniPlayer = useCallback(() => {
    setIsMiniPlayerDismissed(true);
  }, []);

  const showMiniPlayer = useCallback(() => {
    setIsMiniPlayerDismissed(false);
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        timeLeft,
        isRunning,
        isWorkSession,
        workDuration,
        breakDuration,
        sessionsCompleted,
        totalWorkTime,
        totalBreakTime,
        isMuted,
        hasActiveSession,
        ambientSound,
        ambientVolume,
        ambientAutoPlay,
        isAmbientPlaying,
        start,
        pause,
        toggle,
        reset,
        skip,
        setWorkDuration,
        setBreakDuration,
        setIsMuted,
        applySettings,
        setAmbientSound,
        setAmbientVolume,
        setAmbientAutoPlay,
        toggleAmbientSound,
        isMiniPlayerDismissed,
        dismissMiniPlayer,
        showMiniPlayer,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroContext must be used within PomodoroProvider');
  }
  return context;
}
