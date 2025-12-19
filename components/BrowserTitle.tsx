'use client';

import { useEffect } from 'react';
import useAppStore from '@/lib/store';

export default function BrowserTitle() {
  const university = useAppStore((state) => state.settings.university);

  useEffect(() => {
    if (university) {
      const titles: Record<string, string> = {
        'Brigham Young University': 'BYU Survival Tool',
        'Brigham Young University Idaho': 'BYUI Survival Tool',
        'Brigham Young University Hawaii': 'BYUH Survival Tool',
        'UNC Chapel Hill': 'UNC Survival Tool',
        'Utah State University': 'USU Survival Tool',
        'Utah Valley University': 'UVU Survival Tool',
      };
      document.title = titles[university] || 'College Survival Tool';
    } else {
      document.title = 'College Survival Tool';
    }
  }, [university]);

  return null;
}
