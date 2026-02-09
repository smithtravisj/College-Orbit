'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import Button from '@/components/ui/Button';
import useAppStore from '@/lib/store';
import { usePomodoroContext } from '@/context/PomodoroContext';
import AmbientSoundPicker from '@/components/tools/AmbientSoundPicker';

interface Props {
  theme?: string;
}

export default function PomodoroTimer({ theme = 'dark' }: Props) {
  const { settings } = useAppStore();
  const {
    timeLeft,
    isRunning,
    isWorkSession,
    workDuration,
    breakDuration,
    sessionsCompleted,
    totalWorkTime,
    totalBreakTime,
    isMuted,
    toggle,
    reset,
    skip,
    setIsMuted,
    applySettings,
  } = usePomodoroContext();

  const [settingsMode, setSettingsMode] = useState(false);
  const [tempWorkDuration, setTempWorkDuration] = useState<number | ''>(workDuration);
  const [tempBreakDuration, setTempBreakDuration] = useState<number | ''>(breakDuration);

  // Sync temp settings when opening settings panel
  useEffect(() => {
    if (settingsMode) {
      setTempWorkDuration(workDuration);
      setTempBreakDuration(breakDuration);
    }
  }, [settingsMode, workDuration, breakDuration]);

  const handleApplySettings = () => {
    const workDur = typeof tempWorkDuration === 'number' ? tempWorkDuration : 25;
    const breakDur = typeof tempBreakDuration === 'number' ? tempBreakDuration : 5;
    applySettings(workDur, breakDur, isMuted);
    setSettingsMode(false);
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

  // For work session: use accent color (college color or orbit purple)
  const accentColor = 'var(--accent)';

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
                  setIsMuted(e.target.checked);
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
              onClick={handleApplySettings}
              size="md"
              style={{
                flex: 1,
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
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
              ...(isWorkSession ? accentStyle : {}),
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
              onClick={toggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: isRunning ? pauseButtonColor : 'var(--accent)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                color: 'var(--accent-text)',
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
              onClick={skip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'var(--panel-2)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
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
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'var(--panel-2)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
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

          {/* Focus Sounds */}
          <AmbientSoundPicker />

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
