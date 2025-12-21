'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  theme?: string;
}

export default function PomodoroTimer({ theme = 'dark' }: Props) {
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [settingsMode, setSettingsMode] = useState(false);
  const [tempWorkDuration, setTempWorkDuration] = useState<number | ''>(25);
  const [tempBreakDuration, setTempBreakDuration] = useState<number | ''>(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    // Set session start time when timer starts
    if (sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = Date.now();
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer ended
          playNotification();

          if (isWorkSession) {
            // Work session ended, switch to break
            setSessionsCompleted((s) => s + 1);
            setTotalWorkTime((t) => t + workDuration);
            setIsWorkSession(false);
            sessionStartTimeRef.current = null;
            return breakDuration * 60;
          } else {
            // Break ended, switch to work
            setTotalBreakTime((t) => t + breakDuration);
            setIsWorkSession(true);
            sessionStartTimeRef.current = null;
            return workDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, workDuration, breakDuration, isWorkSession]);

  const playNotification = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = isWorkSession ? 800 : 600; // Higher pitch for work end, lower for break end
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
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
  };

  const skipSession = () => {
    // Calculate elapsed time in minutes
    let elapsedMinutes = 0;
    if (sessionStartTimeRef.current !== null) {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      elapsedMinutes = Math.round(elapsedSeconds / 60);
    } else {
      // If no start time (shouldn't happen), use the time spent (full duration - time left)
      if (isWorkSession) {
        elapsedMinutes = workDuration - Math.ceil(timeLeft / 60);
      } else {
        elapsedMinutes = breakDuration - Math.ceil(timeLeft / 60);
      }
    }

    if (isWorkSession) {
      setTotalWorkTime((t) => t + elapsedMinutes);
      setSessionsCompleted((s) => s + 1);
      setIsWorkSession(false);
      setTimeLeft(breakDuration * 60);
    } else {
      setTotalBreakTime((t) => t + elapsedMinutes);
      setIsWorkSession(true);
      setTimeLeft(workDuration * 60);
    }
    sessionStartTimeRef.current = null;
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

  // Lighten colors for dark mode
  const isDarkMode = theme === 'dark' || theme === 'system';
  const accentColor = isDarkMode ? '#5b9fff' : 'var(--accent)';
  const successColor = isDarkMode ? '#6bc96b' : 'var(--success)';

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

          <div style={{ display: 'flex', gap: '12px' }}>
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
            <Button
              onClick={() => setSettingsMode(false)}
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
            >
              Cancel
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
                backgroundColor: isRunning ? '#660000' : 'var(--accent)',
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
            Customize Durations
          </button>
        </>
      )}
    </div>
  );
}
