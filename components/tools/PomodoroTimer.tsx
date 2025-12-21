'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import Button from '@/components/ui/Button';
import useAppStore from '@/lib/store';

interface Props {
  theme?: string;
}

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

export default function PomodoroTimer({ theme = 'dark' }: Props) {
  const { settings, updateSettings } = useAppStore();
  const [workDuration, setWorkDuration] = useState(settings?.pomodoroWorkDuration || 25); // minutes
  const [breakDuration, setBreakDuration] = useState(settings?.pomodoroBreakDuration || 5); // minutes
  const [timeLeft, setTimeLeft] = useState((settings?.pomodoroWorkDuration || 25) * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [settingsMode, setSettingsMode] = useState(false);
  const [tempWorkDuration, setTempWorkDuration] = useState<number | ''>(settings?.pomodoroWorkDuration || 25);
  const [tempBreakDuration, setTempBreakDuration] = useState<number | ''>(settings?.pomodoroBreakDuration || 5);
  const [isMuted, setIsMuted] = useState(settings?.pomodoroIsMuted || false);
  const [hasRestored, setHasRestored] = useState(false); // Track if we've restored from localStorage
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastMinuteCountedRef = useRef(0);

  // Restore timer state from localStorage on mount (use layoutEffect to run synchronously)
  useLayoutEffect(() => {
    try {
      const savedState = localStorage.getItem('pomodoroState');
      console.log('[PomodoroTimer] Restoring from localStorage:', savedState);
      if (savedState) {
        const state = JSON.parse(savedState);
        console.log('[PomodoroTimer] Parsed state:', state);
        setWorkDuration(state.workDuration || 25);
        setBreakDuration(state.breakDuration || 5);
        setTimeLeft(state.timeLeft || (state.workDuration || 25) * 60);
        setIsRunning(state.isRunning || false);
        setIsWorkSession(state.isWorkSession !== false);
        setSessionsCompleted(state.sessionsCompleted || 0);
        setTotalWorkTime(state.totalWorkTime || 0);
        setTotalBreakTime(state.totalBreakTime || 0);

        // Restore session timing if timer was running
        if (state.isRunning && state.sessionStartTime) {
          const elapsedSeconds = Math.floor((Date.now() - state.sessionStartTime) / 1000);
          const sessionDuration = state.isWorkSession ? state.workDuration * 60 : state.breakDuration * 60;
          const newTimeLeft = Math.max(0, sessionDuration - elapsedSeconds);
          console.log('[PomodoroTimer] Timer was running, elapsed seconds:', elapsedSeconds, 'new timeLeft:', newTimeLeft);
          setTimeLeft(newTimeLeft);
          sessionStartTimeRef.current = Date.now() - (sessionDuration - newTimeLeft) * 1000;
          lastMinuteCountedRef.current = Math.floor((sessionDuration - newTimeLeft) / 60);
        }
      } else {
        console.log('[PomodoroTimer] No saved state in localStorage');
      }
    } catch (error) {
      console.error('Failed to restore timer state:', error);
    }
  }, []);

  // Signal that restore is complete so save effect can start working
  useEffect(() => {
    setHasRestored(true);
  }, []);

  // Sync durations and mute setting from store to local state
  useEffect(() => {
    if (settings?.pomodoroWorkDuration) setWorkDuration(settings.pomodoroWorkDuration);
    if (settings?.pomodoroBreakDuration) setBreakDuration(settings.pomodoroBreakDuration);
    if (settings?.pomodoroIsMuted !== undefined) setIsMuted(settings.pomodoroIsMuted);
  }, [settings?.pomodoroWorkDuration, settings?.pomodoroBreakDuration, settings?.pomodoroIsMuted]);

  // Save timer state to localStorage whenever it changes (but skip initial saves until after restore)
  useEffect(() => {
    // Skip saves on initial mount - let restore effect complete first
    if (!hasRestored) {
      console.log('[PomodoroTimer] Skipping save until after restore');
      return;
    }

    const state = {
      workDuration,
      breakDuration,
      timeLeft,
      isRunning,
      isWorkSession,
      sessionsCompleted,
      totalWorkTime,
      totalBreakTime,
      sessionStartTime: sessionStartTimeRef.current,
    };
    console.log('[PomodoroTimer] Saving to localStorage:', state);
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [hasRestored, workDuration, breakDuration, timeLeft, isRunning, isWorkSession, sessionsCompleted, totalWorkTime, totalBreakTime]);

  // Debounced function to save timer settings to database
  const savePomodoroSettings = useRef(
    debounce(
      (work: number, breakDuration: number, muted: boolean) => {
        updateSettings({
          pomodoroWorkDuration: work,
          pomodoroBreakDuration: breakDuration,
          pomodoroIsMuted: muted,
        }).catch((error) => {
          console.error('Error saving Pomodoro settings:', error);
        });
      },
      1000
    )
  ).current;

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    // Set session start time when timer starts
    if (sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = Date.now();
      lastMinuteCountedRef.current = 0;
    }

    timerRef.current = setInterval(() => {
      // Calculate elapsed time based on session start
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
          // Timer ended
          playNotification();

          if (isWorkSession) {
            // Work session ended, switch to break
            setSessionsCompleted((s) => s + 1);
            setIsWorkSession(false);
            sessionStartTimeRef.current = null;
            lastMinuteCountedRef.current = 0;
            setTimeLeft(breakDuration * 60);
          } else {
            // Break ended, switch to work
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
  }, [isRunning, workDuration, breakDuration, isWorkSession]);

  const playNotification = () => {
    // Five-layer micro-chime: slow exhale, stable pitch, peaceful acknowledgement
    if (isMuted) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      // Base volume targeting -18 LUFS
      const layer1Volume = 0.30;
      const layer2Volume = layer1Volume * Math.pow(10, -12 / 20); // -12 dB relative to Layer 1
      const layer3Volume = layer1Volume * Math.pow(10, -22 / 20); // -22 dB
      const layer4Volume = layer1Volume * Math.pow(10, -30 / 20); // -30 dB
      const layer5Volume = layer1Volume * Math.pow(10, -26 / 20); // -26 dB

      // Note progression: D5 → E5 → A5 (peaceful, emotionally neutral)
      const notes = [
        { frequency: 587, duration: 0.30, dynamics: 0.58, gap: 0.08 }, // D5
        { frequency: 659, duration: 0.30, dynamics: 0.60, gap: 0.08 }, // E5
        { frequency: 880, duration: 0.60, dynamics: 0.62, gap: 0.00 }, // A5
      ];

      let currentTime = now;

      notes.forEach((note) => {
        const noteStart = currentTime;
        const noteDuration = note.duration;
        const noteEnd = noteStart + noteDuration;
        const velocity = note.dynamics;

        // === LAYER 1: Core (pure sine) ===
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

        // === LAYER 2: Soft body (sine one octave below) ===
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

        // === LAYER 3: Deep floor (sine two octaves below) ===
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

        // === LAYER 4: Air cushion (sine one octave above) ===
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

        // === LAYER 5: Soft blur (triangle at Layer 1 pitch) ===
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
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeLeft(workDuration * 60);
    setSessionsCompleted(0);
    setTotalWorkTime(0);
    setTotalBreakTime(0);
    sessionStartTimeRef.current = null;
    lastMinuteCountedRef.current = 0;
  };

  const skipSession = () => {
    // Minutes are already counted by the timer, just switch to next session
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
  };

  const applySettings = () => {
    const workDur = typeof tempWorkDuration === 'number' ? tempWorkDuration : 25;
    const breakDur = typeof tempBreakDuration === 'number' ? tempBreakDuration : 5;
    setWorkDuration(workDur);
    setBreakDuration(breakDur);
    setTimeLeft(workDur * 60);
    setSettingsMode(false);
    setIsRunning(false);
    sessionStartTimeRef.current = null;
    lastMinuteCountedRef.current = 0;
    // Save to database
    savePomodoroSettings(workDur, breakDur, isMuted);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const progressPercentage = isWorkSession
    ? ((workDuration * 60 - timeLeft) / (workDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  // Determine colors based on college selection and theme
  const isDarkMode = theme === 'dark' || theme === 'system';
  const hasCollegeSelected = settings?.university;

  // For work session: use college color if selected, else use default blue
  const accentColor = hasCollegeSelected
    ? 'var(--accent)'
    : (isDarkMode ? '#5b9fff' : '#3b82f6');

  // Apply lightening filter when using college color in dark mode
  const accentStyle = hasCollegeSelected && isDarkMode
    ? { filter: 'brightness(1.3) saturate(1.1)' }
    : {};

  const successColor = isDarkMode ? '#6bc96b' : 'var(--success)';
  const pauseButtonColor = isDarkMode ? '#660000' : '#e63946';

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--panel)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
    }}>
      {settingsMode ? (
        // Settings Panel
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '16px',
          }}>
            Timer Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Work Duration */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Work Duration (minutes)
              </label>
              <input
                type="number"
                max="60"
                value={tempWorkDuration}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTempWorkDuration('');
                  } else {
                    setTempWorkDuration(parseInt(val) || '');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <style>{`
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
              `}</style>
            </div>

            {/* Break Duration */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Break Duration (minutes)
              </label>
              <input
                type="number"
                max="30"
                value={tempBreakDuration}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTempBreakDuration('');
                  } else {
                    setTempBreakDuration(parseInt(val) || '');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <style>{`
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
              `}</style>
            </div>
          </div>

          {/* Mute Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
            }}>
              <input
                type="checkbox"
                checked={isMuted}
                onChange={(e) => {
                  const newMuted = e.target.checked;
                  setIsMuted(newMuted);
                  savePomodoroSettings(workDuration, breakDuration, newMuted);
                }}
                style={{
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px',
                }}
              />
              Mute notification sound
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={() => setSettingsMode(false)}
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={applySettings}
              size="md"
              style={{
                flex: 1,
                backgroundColor: 'var(--accent)',
                color: 'white',
              }}
            >
              Apply Settings
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Timer Display */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: isWorkSession ? accentColor : successColor,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '12px',
              letterSpacing: '-2px',
              ...( isWorkSession ? accentStyle : {}),
            }}>
              {formatTime(timeLeft)}
            </div>

            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
            }}>
              {isWorkSession ? 'Work Session' : 'Break Time'}
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercentage}%`,
                backgroundColor: isWorkSession ? accentColor : successColor,
                transition: 'width 0.3s ease',
                ...(isWorkSession ? accentStyle : {}),
              }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            justifyContent: 'center',
          }}>
            <button
              onClick={toggleTimer}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: isRunning ? pauseButtonColor : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {isRunning ? (
                <>
                  <Pause size={18} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start
                </>
              )}
            </button>

            <button
              onClick={skipSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'var(--panel-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <SkipForward size={18} />
              Skip
            </button>

            <button
              onClick={resetTimer}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'var(--panel-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Sessions
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: accentColor,
                ...accentStyle,
              }}>
                {sessionsCompleted}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Work Time
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: accentColor,
                ...accentStyle,
              }}>
                {formatDuration(totalWorkTime)}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Break Time
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: successColor,
              }}>
                {formatDuration(totalBreakTime)}
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsMode(true)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Timer Settings
          </button>
        </>
      )}
    </div>
  );
}
