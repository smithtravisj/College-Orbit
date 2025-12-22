'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
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
  const { updateSettings } = useAppStore();

  // Only render on client after mount to ensure useIsMobile works correctly
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!shouldRun || !mounted) return;

    // Build steps based on device type
    const baseSteps = [
      {
        popover: {
          title: 'Welcome to Your College Survival Tool!',
          description: 'This app helps you manage your courses, deadlines, tasks, notes, exams, and more—all in one place. Let\'s take a quick tour to show you around!',
        }
      },
    ];

    // Add navigation step based on device
    const navigationStep = isMobile
      ? {
          element: '[data-tour="mobile-hamburger"]',
          popover: {
            title: 'Navigation Menu',
            description: 'Tap the menu icon (☰) to open the navigation drawer. From there, you can navigate to Dashboard, Calendar, Courses, Tasks, Deadlines, Exams, Notes, and Settings.',
            side: 'bottom',
            align: 'center'
          }
        }
      : {
          element: '[data-tour="navigation"]',
          popover: {
            title: 'Navigation',
            description: 'Use the sidebar to navigate to your Dashboard, Calendar, Courses, Tasks, Deadlines, Exams, Notes, Tools, and Settings.',
            side: 'right',
            align: 'start'
          }
        };

    const dashboardSteps = [
      {
        element: '[data-tour="next-class"]',
        popover: {
          title: 'Your Next Class',
          description: 'This card shows your upcoming class with the time and location. Click on a course to see more details, meeting times, and links to Canvas or other resources.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="overview"]',
        popover: {
          title: 'Quick Overview',
          description: 'See at a glance how many classes you have left today, overdue items, deadlines coming up, and tasks due today.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="today-tasks"]',
        popover: {
          title: 'Today\'s Tasks',
          description: 'Personal to-do items for today. Click the + button to add a new task, or check the box to mark tasks as done. Create checklists and organize your priorities.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="due-soon"]',
        popover: {
          title: 'Upcoming Deadlines',
          description: 'Course assignments and deadlines coming up. Click the + button to add new deadlines for your courses. These appear on your calendar and send you reminders.',
          side: 'top',
          align: 'start'
        }
      },
    ];

    // Navigation steps - differ between mobile and desktop
    const navigationSteps = isMobile ? [
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Add Your Courses',
          description: 'Tap the menu icon to open the navigation. Go to "Courses" to add all your classes. Include meeting times, location, instructors, and links to Canvas, email, or other resources.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Take Rich Notes',
          description: 'From the menu, go to "Notes" to create study notes with rich text formatting. Organize notes into folders, add tags, and pin your most important notes for quick access.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Track Your Exams',
          description: 'From the menu, go to "Exams" to add your test dates, times, and locations. Set up custom exam reminders (7 days, 1 day, 3 hours before) to stay prepared.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'View Your Calendar',
          description: 'From the menu, go to "Calendar" to see your classes, deadlines, and exams in calendar view. Switch between month, week, and day views to plan your schedule.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="mobile-hamburger"]',
        popover: {
          title: 'Customize Your Experience',
          description: 'From the menu, go to "Settings" to select your university, choose your theme (light/dark), hide/show pages and dashboard cards, export your data, and restart this tour anytime!',
          side: 'bottom',
          align: 'center'
        }
      },
    ] : [
      {
        element: 'a[href="/courses"]',
        popover: {
          title: 'Add Your Courses',
          description: 'Go to "Courses" in the sidebar to add all your classes. Include meeting times, location, instructors, and links to Canvas, email, or other resources.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/notes"]',
        popover: {
          title: 'Take Rich Notes',
          description: 'Go to "Notes" to create study notes with rich text formatting. Organize notes into folders, add tags, and pin your most important notes for quick access.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/exams"]',
        popover: {
          title: 'Track Your Exams',
          description: 'Go to "Exams" to add your test dates, times, and locations. Set up custom exam reminders (7 days, 1 day, 3 hours before) to stay prepared.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/calendar"]',
        popover: {
          title: 'View Your Calendar',
          description: 'Go to "Calendar" to see your classes, deadlines, and exams in calendar view. Switch between month, week, and day views to plan your schedule.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: 'a[href="/tools"]',
        popover: {
          title: 'Use Productivity Tools',
          description: 'Go to "Tools" for the Pomodoro timer (to boost focus during study sessions) and GPA calculator. Customize timer durations to match your study style.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: '[data-tour="settings-link"]',
        popover: {
          title: 'Customize Your Experience',
          description: 'In Settings, select your university, choose your theme (light/dark), hide/show pages and dashboard cards, export your data, and restart this tour anytime!',
          side: 'right',
          align: 'start'
        }
      },
    ];

    const steps = [
      ...baseSteps,
      navigationStep,
      ...dashboardSteps,
      ...navigationSteps,
    ];

    const tourDriver = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps,
      onDestroyed: async () => {
        // Mark onboarding as complete when tour ends (completed or skipped)
        try {
          console.log('[OnboardingTour] Marking onboarding as complete...');
          await updateSettings({ hasCompletedOnboarding: true });
          console.log('[OnboardingTour] Successfully marked onboarding as complete');
        } catch (error) {
          console.error('[OnboardingTour] Failed to mark onboarding as complete:', error);
        }
        onComplete?.();
      },
    });

    tourDriver.drive();

    return () => {
      tourDriver.destroy();
    };
  }, [shouldRun, mounted, isMobile, updateSettings, onComplete]);

  return null;
}
