// Map universities to their app titles
export const universityTitles: Record<string, string> = {
  'Arizona State University': 'ASU Survival Tool',
  'Brigham Young University': 'BYU Survival Tool',
  'Brigham Young University Hawaii': 'BYUH Survival Tool',
  'Brigham Young University Idaho': 'BYUI Survival Tool',
  'Ohio State University': 'OSU Survival Tool',
  'UNC Chapel Hill': 'UNC Survival Tool',
  'University of Central Florida': 'UCF Survival Tool',
  'University of Texas at Austin': 'College Survival Tool',
  'Utah State University': 'USU Survival Tool',
  'Utah Valley University': 'UVU Survival Tool',
};

export function getAppTitle(university: string | null | undefined): string {
  if (!university || !universityTitles[university]) {
    return 'College Survival Tool';
  }
  return universityTitles[university];
}
