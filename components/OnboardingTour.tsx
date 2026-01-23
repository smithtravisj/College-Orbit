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

      // Build steps based on device type
      const baseSteps = [
      {
        popover: {
          title: 'Welcome to College Orbit!',
          description: 'This app helps you manage your courses, assignments, tasks, notes, exams, and more—all in one place. Let\'s take a quick tour to show you around!',
        }
      },
    ];

    // Add navigation step based on device
    const navigationStep = isMobile
      ? {
          element: '[data-tour="mobile-hamburger"]',
          popover: {
            title: 'Navigation Menu',
            description: 'Tap the menu icon (☰) to open the navigation drawer. From there, you can navigate to Dashboard, Calendar, Work, Exams, Notes, Courses, and Settings.',
            side: 'bottom',
            align: 'center'
          }
        }
      : {
          element: '[data-tour="navigation"]',
          popover: {
            title: 'Navigation',
            description: 'Use the sidebar to navigate to your Dashboard, Calendar, Work, Exams, Notes, Courses, Tools, and Settings.',
            side: 'right',
            align: 'start'
          }
        };

    const dashboardSteps = [
      {
        element: '[data-tour="timeline"]',
        popover: {
          title: 'Your Timeline',
          description: 'See all your classes, tasks, assignments, exams, and events in one unified view. Toggle between Today and Week to plan ahead. Click any item to see details or mark it complete.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="overview"]',
        popover: {
          title: 'Quick Overview',
          description: 'See at a glance how many classes you have left today, items due soon, overdue items, and tasks for today.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="quick-add"]',
        popover: {
          title: 'Quick Add',
          description: 'Quickly add tasks, assignments, exams, notes, or calendar events from anywhere in the app. On desktop, press Cmd+K (or Ctrl+K) to open it instantly.',
          side: 'left',
          align: 'center'
        }
      },
    ];

    // Navigation steps - differ between mobile and desktop
    // Order matches nav: Calendar, Work, Exams, Notes, Courses, Shopping, Settings
    const navigationSteps = isMobile ? [
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Calendar',
          description: 'See all your classes, assignments, and exams in one place. Export to Google Calendar or Apple Calendar.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Work',
          description: 'Manage all your tasks, assignments, readings, and projects in one place.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Exams',
          description: 'Add test dates, times, and locations. Set up reminders so you never miss one.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Notes',
          description: 'Create study notes with rich text formatting. Organize into folders and attach files.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Courses',
          description: 'Add your classes with meeting times, locations, and links to Canvas or other resources.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Shopping',
          description: 'Track groceries, wishlists, and pantry items. Great for meal planning and dorm supplies.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Settings',
          description: 'Select your university, choose a theme, and restart this tour anytime.',
          side: 'bottom',
          align: 'center'
        }
      },
    ] : [
      {
        element: 'a[href="/calendar"]',
        popover: {
          title: 'Calendar',
          description: 'See all your classes, assignments, and exams in one place. Export to Google Calendar or Apple Calendar.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/work"]',
        popover: {
          title: 'Work',
          description: 'Manage all your tasks, assignments, readings, and projects in one place.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/exams"]',
        popover: {
          title: 'Exams',
          description: 'Add test dates, times, and locations. Set up reminders so you never miss one.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/notes"]',
        popover: {
          title: 'Notes',
          description: 'Create study notes with rich text formatting. Organize into folders and attach files.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/courses"]',
        popover: {
          title: 'Courses',
          description: 'Add your classes with meeting times, locations, and links to Canvas or other resources.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/shopping"]',
        popover: {
          title: 'Shopping',
          description: 'Track groceries, wishlists, and pantry items. Great for meal planning and dorm supplies.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: '[data-tour="settings-link"]',
        popover: {
          title: 'Settings',
          description: 'Select your university, choose a theme, and restart this tour anytime.',
          side: 'right',
          align: 'start'
        }
      },
    ];

    const finalStep = {
      popover: {
        title: 'You\'re All Set!',
        description: 'You now know the basics of College Orbit. Start by adding your courses, and everything else will fall into place. Good luck this semester!',
      }
    };

    const steps = [
      ...baseSteps,
      navigationStep,
      ...dashboardSteps,
      ...navigationSteps,
      finalStep,
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
