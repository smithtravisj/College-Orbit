'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './OnboardingTour.css';
import useAppStore from '@/lib/store';

interface OnboardingTourProps {
  shouldRun: boolean;
  onComplete?: () => void;
}

export default function OnboardingTour({ shouldRun, onComplete }: OnboardingTourProps) {
  const { updateSettings } = useAppStore();

  useEffect(() => {
    if (!shouldRun) return;

    const tourDriver = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          popover: {
            title: 'Welcome to Your College Survival Tool!',
            description: 'This app helps you manage your courses, deadlines, and tasks all in one place. Let\'s take a quick tour to show you around!',
          }
        },
        {
          element: '[data-tour="navigation"]',
          popover: {
            title: 'Navigate Your Way',
            description: 'Use the sidebar to access different sections: Dashboard (home), Calendar (schedule view), Courses (all your classes), Tasks (to-dos), Deadlines (assignments), Tools (utilities), and Settings.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="next-class"]',
          popover: {
            title: 'Your Next Class',
            description: 'This card shows your upcoming class with the time and location. Click on a course to see more details.',
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
            description: 'Personal to-do items for today. Click the + button to add a new task, or check the box to mark tasks as done. Tasks are separate from course deadlines.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="due-soon"]',
          popover: {
            title: 'Upcoming Deadlines',
            description: 'Course assignments and deadlines coming up. Click the + button to add a new deadline for one of your courses. These are linked to your courses and appear on your calendar.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: 'a[href="/courses"]',
          popover: {
            title: 'Add Your Courses',
            description: 'Go to "Courses" in the sidebar to add your classes. Include meeting times, location, and links to resources like Canvas or email.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '[data-tour="settings-link"]',
          popover: {
            title: 'Customize Your Experience',
            description: 'In Settings, select your university, choose your theme (light/dark), hide/show specific pages and cards, and restart this tour anytime!',
            side: 'right',
            align: 'start'
          }
        },
      ],
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
  }, [shouldRun, updateSettings, onComplete]);

  return null;
}
