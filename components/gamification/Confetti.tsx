'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
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

export default function Confetti({
  active,
  duration = 5000,
  particleCount = 200,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatingRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const createParticles = useCallback((): Particle[] => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: -(h * 0.4) + Math.random() * (h * 0.5),
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 10,
        speedX: (Math.random() - 0.5) * 2.5,
        speedY: 0.6 + Math.random() * 1.5,
        rotationSpeed: (Math.random() - 0.5) * 4,
        isCircle: Math.random() > 0.5,
      });
    }
    return particles;
  }, [particleCount]);

  useEffect(() => {
    if (!active || animatingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    animatingRef.current = true;
    particlesRef.current = createParticles();

    const animate = () => {
      if (!animatingRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      let alive = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.speedY += 0.035;

        if (p.y > canvas.height + 50) continue;
        alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }

        ctx.restore();
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    timerRef.current = setTimeout(() => {
      animatingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      onComplete?.();
    }, duration);

    return () => {
      animatingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, duration, createParticles, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}

export function LevelUpConfetti({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      duration={4000}
      particleCount={100}
      onComplete={onComplete}
    />
  );
}
