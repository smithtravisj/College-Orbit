'use client';

import { useEffect } from 'react';
import useAppStore from '@/lib/store';

export default function BrowserTitle() {
  const university = useAppStore((state) => state.settings.university);

  useEffect(() => {
    const titles: Record<string, string> = {
      'Brigham Young University': 'BYU Orbit',
      'Brigham Young University Idaho': 'BYUI Orbit',
      'Brigham Young University Hawaii': 'BYUH Orbit',
      'North Lincoln High School': 'NLHS Orbit',
      'UNC Chapel Hill': 'UNC Orbit',
      'Utah State University': 'USU Orbit',
      'Utah Valley University': 'UVU Orbit',
      'Arizona State University': 'ASU Orbit',
      'University of Central Florida': 'UCF Orbit',
      'Ohio State University': 'OSU Orbit',
      'University of Texas at Austin': 'College Orbit',
    };

    const newTitle = university && titles[university] ? titles[university] : 'College Orbit';
    document.title = newTitle;
  }, [university]);

  // Monitor document title changes to correct them immediately if Next.js resets them
  useEffect(() => {
    const titles: Record<string, string> = {
      'Brigham Young University': 'BYU Orbit',
      'Brigham Young University Idaho': 'BYUI Orbit',
      'Brigham Young University Hawaii': 'BYUH Orbit',
      'North Lincoln High School': 'NLHS Orbit',
      'UNC Chapel Hill': 'UNC Orbit',
      'Utah State University': 'USU Orbit',
      'Utah Valley University': 'UVU Orbit',
      'Arizona State University': 'ASU Orbit',
      'University of Central Florida': 'UCF Orbit',
      'Ohio State University': 'OSU Orbit',
      'University of Texas at Austin': 'College Orbit',
    };

    const expectedTitle = university && titles[university] ? titles[university] : 'College Orbit';

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
