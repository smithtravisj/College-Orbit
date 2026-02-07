'use client';

import { memo, useEffect, useRef, useState } from 'react';
import type { SpriteSheetData } from './petSprites';

interface PetSpriteProps {
  sprite: SpriteSheetData;
  size?: number;
  flipX?: boolean;
  paused?: boolean;
}

function PetSpriteComponent({ sprite, size = 48, flipX = false, paused = false }: PetSpriteProps) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null!);
  const prevSrcRef = useRef(sprite.src);

  // Reset frame when sprite sheet changes
  useEffect(() => {
    if (prevSrcRef.current !== sprite.src) {
      setFrame(0);
      prevSrcRef.current = sprite.src;
    }
  }, [sprite.src]);

  // Animate frames
  useEffect(() => {
    if (paused) return;

    intervalRef.current = setInterval(() => {
      setFrame((prev) => {
        const next = prev + 1;
        if (next >= sprite.frameCount) {
          return sprite.loop ? 0 : prev;
        }
        return next;
      });
    }, sprite.frameDuration);

    return () => clearInterval(intervalRef.current);
  }, [sprite.frameDuration, sprite.frameCount, sprite.loop, paused]);

  const scale = size / sprite.frameHeight;
  const sheetWidth = sprite.frameWidth * sprite.frameCount * scale;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sprite.src})`,
        backgroundPosition: `${-frame * sprite.frameWidth * scale}px 0`,
        backgroundSize: `${sheetWidth}px ${size}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}

export const PetSprite = memo(PetSpriteComponent);
