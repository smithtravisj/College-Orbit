'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface ConfettiLiteProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const COLORS = [
  '#f94144', '#f3722c', '#f8961e', '#f9c74f',
  '#90be6d', '#43aa8b', '#577590', '#9b5de5', '#f15bb5',
];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  isCircle: boolean;
}

/**
 * Lite version of confetti: fewer particles (60), throttled updates (every 3rd frame).
 * Same DOM-based approach as original but much lighter.
 */
export default function ConfettiLite({
  active,
  duration = 5000,
  particleCount = 100,
  onComplete,
}: ConfettiLiteProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameCountRef = useRef(0);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -40 + Math.random() * 50,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 1.2,
        speedY: 0.2 + Math.random() * 0.5,
        rotationSpeed: (Math.random() - 0.5) * 3,
        isCircle: Math.random() > 0.5,
      });
    }
    return newParticles;
  }, [particleCount]);

  useEffect(() => {
    if (!active || isAnimating) return;

    setIsAnimating(true);
    setParticles(createParticles());
    frameCountRef.current = 0;

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, isAnimating, duration, createParticles, onComplete]);

  useEffect(() => {
    if (!isAnimating || particles.length === 0) return;

    let animationFrame: number;
    const animate = () => {
      frameCountRef.current++;
      // Only update React state every 2nd frame for smoother look
      if (frameCountRef.current % 2 === 0) {
        setParticles(prev =>
          prev.map(p => ({
            ...p,
            x: p.x + p.speedX * 2,
            y: p.y + p.speedY * 2,
            rotation: p.rotation + p.rotationSpeed * 2,
            speedY: p.speedY + 0.024,
          })).filter(p => p.y < 120)
        );
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAnimating, particles.length]);

  if (!isAnimating || particles.length === 0) return null;

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
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: particle.isCircle ? '50%' : '2px',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}
