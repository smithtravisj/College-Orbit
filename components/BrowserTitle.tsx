'use client';

import { useEffect } from 'react';
import useAppStore from '@/lib/store';

export default function BrowserTitle() {
  const university = useAppStore((state) => state.settings.university);

  useEffect(() => {
    const titles: Record<string, string> = {
      'Brigham Young University': 'BYU Survival Tool',
      'Brigham Young University Idaho': 'BYUI Survival Tool',
      'Brigham Young University Hawaii': 'BYUH Survival Tool',
      'UNC Chapel Hill': 'UNC Survival Tool',
      'Utah State University': 'USU Survival Tool',
      'Utah Valley University': 'UVU Survival Tool',
    };

    const newTitle = university && titles[university] ? titles[university] : 'College Survival Tool';
    document.title = newTitle;
  }, [university]);

  // Monitor document title changes to correct them immediately if Next.js resets them
  useEffect(() => {
    const titles: Record<string, string> = {
      'Brigham Young University': 'BYU Survival Tool',
      'Brigham Young University Idaho': 'BYUI Survival Tool',
      'Brigham Young University Hawaii': 'BYUH Survival Tool',
      'UNC Chapel Hill': 'UNC Survival Tool',
      'Utah State University': 'USU Survival Tool',
      'Utah Valley University': 'UVU Survival Tool',
    };

    const expectedTitle = university && titles[university] ? titles[university] : 'College Survival Tool';

    // Check every 100ms if the title has been reset and correct it
    const interval = setInterval(() => {
      if (document.title !== expectedTitle && expectedTitle) {
        document.title = expectedTitle;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [university]);

  return null;
}
