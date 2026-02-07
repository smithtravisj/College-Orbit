'use client';

import { useEffect, useState, useId } from 'react';

interface ConfettiCSSProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const COLORS = [
  '#f94144', '#f3722c', '#f8961e', '#f9c74f',
  '#90be6d', '#43aa8b', '#577590', '#9b5de5', '#f15bb5',
];

interface CSSParticle {
  id: number;
  x: number;
  startY: number;
  color: string;
  size: number;
  delay: number;
  driftX: number;
  fallDuration: number;
  isCircle: boolean;
  rotation: number;
}

export default function ConfettiCSS({
  active,
  duration = 5000,
  particleCount = 150,
  onComplete,
}: ConfettiCSSProps) {
  const [particles, setParticles] = useState<CSSParticle[]>([]);
  const [isActive, setIsActive] = useState(false);
  const uniqueId = useId();

  useEffect(() => {
    if (!active || isActive) return;

    const newParticles: CSSParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        startY: -40 + Math.random() * 50,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 10,
        delay: Math.random() * 2.0,
        driftX: (Math.random() - 0.5) * 20,
        fallDuration: 3 + Math.random() * 3,
        isCircle: Math.random() > 0.5,
        rotation: Math.random() * 720 - 360,
      });
    }

    setIsActive(true);
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, isActive, duration, particleCount, onComplete]);

  if (!isActive || particles.length === 0) return null;

  const animName = `confetti-fall-${uniqueId.replace(/:/g, '')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ${animName} {
          0% {
            transform: translateY(var(--startY)) translateX(0px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size * (p.isCircle ? 1 : 0.6),
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `${animName} ${p.fallDuration}s ease-in ${p.delay}s both`,
            willChange: 'transform, opacity',
            ['--startY' as string]: `${p.startY}vh`,
            ['--drift' as string]: `${p.driftX}vw`,
            ['--rot' as string]: `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
