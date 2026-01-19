import { getDatabaseCollege } from './collegeColors';

// Map universities to their app titles (legacy/fallback)
export const universityTitles: Record<string, string> = {
  'Arizona State University': 'ASU Orbit',
  'Brigham Young University': 'BYU Orbit',
  'Brigham Young University Hawaii': 'BYUH Orbit',
  'Brigham Young University Idaho': 'BYUI Orbit',
  'North Lincoln High School': 'NLHS Orbit',
  'Ohio State University': 'OSU Orbit',
  'UNC Chapel Hill': 'UNC Orbit',
  'University of Central Florida': 'UCF Orbit',
  'University of Texas at Austin': 'College Orbit',
  'Utah State University': 'USU Orbit',
  'Utah Valley University': 'UVU Orbit',
};

export function getAppTitle(university: string | null | undefined): string {
  if (!university) {
    return 'College Orbit';
  }

  // Check database colleges first
  const dbCollege = getDatabaseCollege(university);
  if (dbCollege && dbCollege.acronym) {
    return `${dbCollege.acronym} Orbit`;
  }

  // Fallback to hardcoded titles
  if (universityTitles[university]) {
    return universityTitles[university];
  }

  return 'College Orbit';
}
