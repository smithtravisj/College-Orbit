'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiPackageProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export default function ConfettiPackage({
  active,
  duration = 3000,
  particleCount = 200,
  onComplete,
}: ConfettiPackageProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || firedRef.current) return;
    firedRef.current = true;

    const end = Date.now() + duration;
    const perBurst = Math.ceil(particleCount / 15);
    const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#9b5de5', '#f15bb5'];

    // Gentle staggered bursts every 200ms instead of every frame
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        particleCount: perBurst,
        startVelocity: 15,
        spread: 120,
        origin: {
          x: 0.1 + Math.random() * 0.8,
          y: Math.random() * 0.3,
        },
        colors,
        ticks: 200,
        gravity: 0.6,
        scalar: 0.9,
        drift: (Math.random() - 0.5) * 0.5,
      });
    }, 200);

    const timer = setTimeout(() => {
      firedRef.current = false;
      onComplete?.();
    }, duration + 2000); // extra time for particles to finish falling

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      firedRef.current = false;
    };
  }, [active, duration, particleCount, onComplete]);

  return null; // canvas-confetti creates its own canvas
}
