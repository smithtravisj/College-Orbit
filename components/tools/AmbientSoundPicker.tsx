'use client';

import { ChevronDown } from 'lucide-react';
import { usePomodoroContext } from '@/context/PomodoroContext';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import { AMBIENT_SOUNDS, AmbientSoundType } from '@/lib/ambientSoundEngine';

export default function AmbientSoundPicker() {
  const {
    ambientSound,
    ambientVolume,
    ambientAutoPlay,
    isAmbientPlaying,
    setAmbientSound,
    setAmbientVolume,
    setAmbientAutoPlay,
    toggleAmbientSound,
  } = usePomodoroContext();
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <UpgradePrompt feature="Focus Sounds" />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Focus Sounds
      </div>

      {/* Sound type dropdown */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <select
          value={ambientSound || ''}
          onChange={(e) => setAmbientSound(e.target.value ? (e.target.value as AmbientSoundType) : null)}
          style={{
            width: '100%',
            padding: '8px 32px 8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '14px',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        >
          <option value="">None</option>
          {AMBIENT_SOUNDS.map(({ type, label }) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
          }}
        />
      </div>

      {/* Volume slider and controls — only show when a sound is selected */}
      {ambientSound && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Volume slider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '48px' }}>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: '4px',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>
              {Math.round(ambientVolume * 100)}%
            </span>
          </div>

          {/* Auto-play checkbox and manual play button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              <input
                type="checkbox"
                checked={ambientAutoPlay}
                onChange={(e) => setAmbientAutoPlay(e.target.checked)}
                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
              />
              Auto-play with timer
            </label>

            {!ambientAutoPlay && (
              <button
                onClick={toggleAmbientSound}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isAmbientPlaying ? '#e63946' : 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                {isAmbientPlaying ? 'Stop' : 'Play'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
