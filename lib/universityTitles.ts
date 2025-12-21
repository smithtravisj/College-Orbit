// Map universities to their app titles
export const universityTitles: Record<string, string> = {
  'Brigham Young University': 'BYU Survival Tool',
  'Brigham Young University Idaho': 'BYUI Survival Tool',
  'Brigham Young University Hawaii': 'BYUH Survival Tool',
  'UNC Chapel Hill': 'UNC Survival Tool',
  'Utah State University': 'USU Survival Tool',
  'Utah Valley University': 'UVU Survival Tool',
  'Arizona State University': 'ASU Survival Tool',
};

export function getAppTitle(university: string | null | undefined): string {
  if (!university || !universityTitles[university]) {
    return 'College Survival Tool';
  }
  return universityTitles[university];
}
