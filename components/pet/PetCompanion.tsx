'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useAppStore from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { PetSprite } from './PetSprite';
import { sprites, animalWalkSpeed, animalSize } from './petSprites';
import type { SpriteState, AnimalType } from './petSprites';
import { PET_CONFIG, randomBetween } from './petAnimations';

type PetState = 'idle' | 'walking' | 'sitting' | 'sleeping' | 'bark' | 'attack' | 'sniff' | 'liedown';

export default function PetCompanion() {
  const settings = useAppStore((state) => state.settings);
  const { isPremium } = useSubscription();
  const isMobile = useIsMobile();

  const enabled = isPremium && settings.petCompanion;
  const animal = (settings.petCompanionAnimal || 'rottweiler') as AnimalType;

  // State machine
  const [petState, setPetState] = useState<PetState>('idle');
  const [posX, setPosX] = useState(100);
  const [facingRight, setFacingRight] = useState(true);

  // Refs for animation
  const rafRef = useRef<number>(0);
  const walkTargetRef = useRef(300);
  const lastTimeRef = useRef(0);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const reducedMotion = useRef(false);

  const animalSprites = sprites[animal];
  const sizeOverride = animalSize[animal];
  const spriteSize = sizeOverride
    ? (isMobile ? sizeOverride.mobile : sizeOverride.desktop)
    : (isMobile ? PET_CONFIG.mobileSize : PET_CONFIG.desktopSize);
  const walkSpeed = animalWalkSpeed[animal] ?? PET_CONFIG.walkSpeed;

  // Keep sprite data in a ref so callbacks can access it without dependency issues
  const spritesRef = useRef(animalSprites);
  spritesRef.current = animalSprites;
  const walkSpeedRef = useRef(walkSpeed);
  walkSpeedRef.current = walkSpeed;

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotion.current = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Set initial position randomly
  useEffect(() => {
    if (enabled) {
      setPosX(PET_CONFIG.edgePadding + Math.random() * (window.innerWidth - PET_CONFIG.edgePadding * 2 - spriteSize));
    }
  }, [enabled, spriteSize]);

  // Play a one-shot animation then transition to idle
  const playOneShot = useCallback((state: PetState, durationMs: number) => {
    setPetState(state);
    actionTimerRef.current = setTimeout(() => {
      transitionToIdle();
    }, durationMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State transition logic
  const transitionToIdle = useCallback(() => {
    setPetState('idle');
    const duration = randomBetween(PET_CONFIG.idleDurationMin, PET_CONFIG.idleDurationMax);
    stateTimerRef.current = setTimeout(() => {
      if (reducedMotion.current) return;

      const roll = Math.random();
      if (roll > 0.75) {
        // Sit (25%)
        setPetState('sitting');
        const sitDuration = randomBetween(PET_CONFIG.sittingDurationMin, PET_CONFIG.sittingDurationMax);
        stateTimerRef.current = setTimeout(() => {
          if (Math.random() < PET_CONFIG.sleepChance) {
            setPetState('sleeping');
            const sleepDuration = randomBetween(PET_CONFIG.sleepingDurationMin, PET_CONFIG.sleepingDurationMax);
            stateTimerRef.current = setTimeout(() => {
              transitionToIdle();
            }, sleepDuration);
          } else {
            transitionToIdle();
          }
        }, sitDuration);
      } else if (roll > 0.55) {
        // Sniff (20%) — duration from sprite data
        const sniff = spritesRef.current.sniff;
        playOneShot('sniff', sniff.frameCount * sniff.frameDuration);
      } else if (roll > 0.4) {
        // Lie down (15%) — duration from sprite data
        const lie = spritesRef.current.liedown;
        playOneShot('liedown', lie.frameCount * lie.frameDuration);
      } else {
        // Walk (40%)
        const vw = window.innerWidth;
        const target = PET_CONFIG.edgePadding + Math.random() * (vw - PET_CONFIG.edgePadding * 2 - spriteSize);
        walkTargetRef.current = target;
        setFacingRight(target > posX);
        setPetState('walking');
      }
    }, duration);
  }, [posX, spriteSize, playOneShot]);

  // Handle click → bark, second click while barking → attack
  const handleClick = useCallback(() => {
    if (petState === 'attack') return;

    // Cancel current timers
    cancelAnimationFrame(rafRef.current);
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);

    if (petState === 'bark') {
      // Second click while barking → attack
      const atk = spritesRef.current.attack;
      setPetState('attack');
      actionTimerRef.current = setTimeout(() => {
        transitionToIdle();
      }, atk.frameCount * atk.frameDuration);
    } else {
      // First click → bark
      const bark = spritesRef.current.bark;
      setPetState('bark');
      actionTimerRef.current = setTimeout(() => {
        transitionToIdle();
      }, bark.frameCount * bark.frameDuration);
    }
  }, [petState, transitionToIdle]);

  // Walking animation loop
  useEffect(() => {
    if (petState !== 'walking') return;

    lastTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setPosX((prev) => {
        const target = walkTargetRef.current;
        const diff = target - prev;
        const step = walkSpeedRef.current * dt;

        if (Math.abs(diff) <= step) {
          setTimeout(() => transitionToIdle(), 0);
          return target;
        }
        return prev + Math.sign(diff) * step;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [petState, transitionToIdle]);

  // Visibility change: pause when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
        if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      } else if (enabled) {
        if (petState === 'walking' || petState === 'bark' || petState === 'attack') {
          transitionToIdle();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, petState, transitionToIdle]);

  // Initial state kickoff
  useEffect(() => {
    if (!enabled) return;
    transitionToIdle();
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled || !animalSprites) return null;

  // Map pet state to sprite state
  const spriteState: SpriteState = petState;
  const spriteData = animalSprites[spriteState];

  return (
    <div
      style={{
        position: 'fixed',
        left: posX,
        bottom: PET_CONFIG.bottomOffset,
        zIndex: PET_CONFIG.zIndex,
        width: spriteSize,
        height: spriteSize,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: spriteSize * 0.5,
          height: spriteSize * 0.55,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        onClick={handleClick}
      />
      <PetSprite
        sprite={spriteData}
        size={spriteSize}
        flipX={!facingRight}
      />
    </div>
  );
}
