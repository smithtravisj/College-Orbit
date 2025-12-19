'use client';

import { useEffect, useRef } from 'react';
import useAppStore from '@/lib/store';

export default function BrowserTitle() {
  const university = useAppStore((state) => state.settings.university);
  const previousUniversityRef = useRef<string | null>(null);

  useEffect(() => {
    const allState = useAppStore.getState();
    console.log('[BrowserTitle] Full store check - university:', university);
    console.log('[BrowserTitle] Complete settings object:', allState.settings);

    if (previousUniversityRef.current !== university) {
      console.log('[BrowserTitle] CHANGE DETECTED: from', previousUniversityRef.current, '→', university);
      previousUniversityRef.current = university;
    }

    if (university) {
      const titles: Record<string, string> = {
        'Brigham Young University': 'BYU Survival Tool',
        'Brigham Young University Idaho': 'BYUI Survival Tool',
        'Brigham Young University Hawaii': 'BYUH Survival Tool',
        'UNC Chapel Hill': 'UNC Survival Tool',
        'Utah State University': 'USU Survival Tool',
        'Utah Valley University': 'UVU Survival Tool',
      };
      const newTitle = titles[university] || 'College Survival Tool';
      console.log('[BrowserTitle] Setting title to:', newTitle);
      // Only update if title actually changed to avoid flashing
      if (document.title !== newTitle) {
        document.title = newTitle;
      }
    } else {
      console.log('[BrowserTitle] No university, setting to College Survival Tool');
      if (document.title !== 'College Survival Tool') {
        document.title = 'College Survival Tool';
      }
    }
  }, [university]);

  return null;
}
