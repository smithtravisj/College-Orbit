'use client';

import { useSpotifyContext } from '@/context/SpotifyContext';

interface SpotifyVisualizerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function SpotifyVisualizer({ size = 'medium', className = '' }: SpotifyVisualizerProps) {
  const { visualizerBars, isPlaying } = useSpotifyContext();

  const sizeConfig = {
    small: { height: 16, width: 16, barWidth: 2, gap: 1 },
    medium: { height: 24, width: 24, barWidth: 3, gap: 2 },
    large: { height: 32, width: 32, barWidth: 4, gap: 2 },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`flex items-end justify-center ${className}`}
      style={{ height: config.height, width: config.width, gap: config.gap }}
    >
      {visualizerBars.map((height, index) => (
        <div
          key={index}
          className="rounded-sm"
          style={{
            width: config.barWidth,
            height: `${height * 100}%`,
            minHeight: 2,
            backgroundColor: isPlaying ? '#1DB954' : 'var(--muted-foreground)',
            transition: 'height 100ms ease-out',
          }}
        />
      ))}
    </div>
  );
}
