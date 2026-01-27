'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './OnboardingTour.css';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface OnboardingTourProps {
  shouldRun: boolean;
  onComplete?: () => void;
}

export default function OnboardingTour({ shouldRun, onComplete }: OnboardingTourProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const driverRef = useRef<Driver | null>(null);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep refs updated
  onCompleteRef.current = onComplete;

  const handleTourComplete = useCallback(async () => {
    const { updateSettings } = useAppStore.getState();
    try {
      console.log('[OnboardingTour] Marking onboarding as complete...');
      await updateSettings({ hasCompletedOnboarding: true });
      console.log('[OnboardingTour] Successfully marked onboarding as complete');
    } catch (error) {
      console.error('[OnboardingTour] Failed to mark onboarding as complete:', error);
    }
    onCompleteRef.current?.();
  }, []);

  // Only render on client after mount to ensure useIsMobile works correctly
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!shouldRun || !mounted) return;

    // Prevent re-starting the tour if it's already running
    if (hasStartedRef.current && driverRef.current) {
      console.log('[OnboardingTour] Tour already running, skipping re-init');
      return;
    }

    // Dynamically import driver.js only when needed (Safari mobile performance)
    const loadAndStartTour = async () => {
      // Load driver.js dynamically
      const { driver } = await import('driver.js');

      const steps = [
      {
        popover: {
          title: 'Welcome to College Orbit!',
          description: 'College Orbit helps you manage courses, assignments, exams, and more.',
        }
      },
      {
        element: '[data-tour="timeline"]',
        popover: {
          title: 'Your Timeline',
          description: 'Your timeline shows everything happening today and this week.',
          side: 'bottom' as const,
          align: 'start' as const,
        }
      },
      {
        element: '[data-tour="quick-add"]',
        popover: {
          title: 'Quick Add',
          description: isMobile
            ? 'Tap the + button to quickly add anything from anywhere.'
            : 'Press Cmd+K to quickly add anything from anywhere.',
          side: 'left' as const,
          align: 'center' as const,
        }
      },
      {
        popover: {
          title: 'Connect Your LMS',
          description: 'Connect Canvas or another LMS to import your courses and assignments instantly. Go to Settings to get started.',
        }
      },
    ];

      const tourDriver = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps,
        onPopoverRender: (_popover, options) => {
          console.log('[OnboardingTour] Rendering step:', options.state.activeIndex, 'of', steps.length);
        },
        onDestroyed: () => {
          console.log('[OnboardingTour] Tour destroyed');
          hasStartedRef.current = false;
          driverRef.current = null;
          handleTourComplete();
        },
      });

      driverRef.current = tourDriver;
      hasStartedRef.current = true;
      tourDriver.drive();
    };

    loadAndStartTour();

    return () => {
      // Only destroy if component is actually unmounting, not on re-renders
      // The tour will handle its own cleanup via onDestroyed
    };
  }, [shouldRun, mounted, isMobile, handleTourComplete]);

  return null;
}
