'use client';

import { useEffect, useRef } from 'react';
import useAppStore from '@/lib/store';

export default function BrowserTitle() {
  const university = useAppStore((state) => state.settings.university);
  const previousUniversityRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    previousUniversityRef.current = university;

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
      if (document.title !== newTitle) {
        document.title = newTitle;
      }
    } else {
      if (document.title !== 'College Survival Tool') {
        document.title = 'College Survival Tool';
      }
    }
  }, [university]);

  return null;
}
